#!/usr/bin/env python3
"""Read-only CTA transport gate; Python 3.6 compatible, no event writes."""
import argparse
import json
import subprocess
import sys
from urllib.parse import urlsplit


class TransportError(Exception):
    pass


def validate_transport(web, collector):
    origins = [entry.split('=', 1)[1] for entry in web.get('Config', {}).get('Env', [])
               if entry.startswith('CTA_ANALYTICS_ORIGIN=')]
    if len(origins) != 1 or not origins[0]:
        raise TransportError('CTA_ORIGIN_MISSING_OR_DUPLICATED')
    try:
        origin = urlsplit(origins[0])
        port = origin.port
    except ValueError:
        raise TransportError('CTA_ORIGIN_INVALID')
    if (origin.scheme not in ('http', 'https') or not origin.hostname
            or origin.username or origin.password or origin.query or origin.fragment
            or origin.path not in ('', '/')):
        raise TransportError('CTA_ORIGIN_INVALID')
    web_networks = web.get('NetworkSettings', {}).get('Networks', {})
    collector_networks = collector.get('NetworkSettings', {}).get('Networks', {})
    shared = []
    for name, network in web_networks.items():
        other = collector_networks.get(name, {})
        if (name not in ('bridge', 'host', 'none') and network.get('NetworkID')
                and network.get('NetworkID') == other.get('NetworkID')):
            shared.append(other)
    if not shared:
        raise TransportError('CTA_SHARED_USER_NETWORK_MISSING')
    collector_name = collector.get('Name', '').lstrip('/')
    # URL hostnames and Docker DNS aliases are case-insensitive. Existing
    # collector release aliases contain uppercase R42 and must still match.
    if not any(origin.hostname in [hostname.lower() for hostname in
               ([collector_name] + (network.get('Aliases') or [])
                + (network.get('DNSNames') or [])) if isinstance(hostname, str)]
               for network in shared):
        raise TransportError('CTA_COLLECTOR_HOSTNAME_NOT_OWNED')
    return {'status': 'PASS_METADATA', 'sharedUserNetwork': True,
            'collectorOwnsOriginHostname': True}


def docker_json(args):
    try:
        result = subprocess.run(['docker'] + args, stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE, timeout=15, check=True)
        return json.loads(result.stdout.decode('utf-8'))
    except (subprocess.SubprocessError, OSError, ValueError):
        raise TransportError('CTA_DOCKER_READ_FAILED')


def verify_live(web_name, collector_name):
    web = docker_json(['inspect', web_name])[0]
    collector = docker_json(['inspect', collector_name])[0]
    result = validate_transport(web, collector)
    # Use the web container's configured origin internally. Emit only a minimal
    # health verdict, never the origin, environment inventory or response body.
    code = """const base=process.env.CTA_ANALYTICS_ORIGIN;
const u=new URL('/health/cta-ready',base);
const http=require(u.protocol==='https:'?'https':'http');
const req=http.get(u,res=>{let body='';res.on('data',chunk=>{body+=chunk;if(body.length>16384)req.destroy();});
res.on('end',()=>{try{const data=JSON.parse(body);const ok=res.statusCode===200&&data.ready===true&&data.environment==='production';
console.log(JSON.stringify({status:ok?'PASS':'FAIL',ready:data.ready===true,production:data.environment==='production'}));process.exitCode=ok?0:1;
}catch{process.exitCode=1;}});});
req.setTimeout(7000,()=>req.destroy());req.on('error',()=>{process.exitCode=1;});"""
    health = docker_json(['exec', web_name, 'node', '-e', code])
    if health != {'status': 'PASS', 'ready': True, 'production': True}:
        raise TransportError('CTA_UPSTREAM_HEALTH_INVALID')
    result.update({'status': 'PASS', 'upstreamReady': True, 'environment': 'production',
                   'ctaPosts': 0, 'mutations': 0})
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--web-container')
    parser.add_argument('--collector-container')
    parser.add_argument('--fixture', action='store_true', help=argparse.SUPPRESS)
    args = parser.parse_args()
    try:
        if args.fixture:
            data = json.load(sys.stdin)
            result = validate_transport(data['web'], data['collector'])
        else:
            if not args.web_container or not args.collector_container:
                parser.error('--web-container and --collector-container are required')
            result = verify_live(args.web_container, args.collector_container)
        print(json.dumps(result, sort_keys=True))
        return 0
    except (TransportError, ValueError, KeyError, IndexError, TypeError):
        error = sys.exc_info()[1]
        reason = str(error) if isinstance(error, TransportError) else 'CTA_INPUT_INVALID'
        print(json.dumps({'status': 'FAIL', 'reasonCode': reason, 'ctaPosts': 0,
                          'mutations': 0}, sort_keys=True))
        return 1


if __name__ == '__main__':
    sys.exit(main())
