#!/usr/bin/env python3
"""Run through SSH stdin: inspect Docker and summarize 48h logs without sending.

No remote files are written. Never emits raw inspect, command arguments, env
values, or raw logs. Counts describe retained Docker logs, not rotated history.
"""
import collections
import datetime
import json
import re
import subprocess


def redact(text, secrets=()):
    for value in sorted(set(secrets), key=len, reverse=True):
        if value:
            text = text.replace(value, "[REDACTED]")
    text = re.sub(r"https?://[^\s\"'<>]+", "[URL]", text)
    text = re.sub(r"\b\d{5,}:[A-Za-z0-9_-]+", "[BOT_TOKEN]", text)
    text = re.sub(r"(?i)((?:token|password|secret|authorization|api[_-]?key)\s*[=:]\s*)[^\s,}\"']+", r"\1[REDACTED]", text)
    text = re.sub(r"\b[A-Za-z0-9_=-]{40,}\b", "[OPAQUE]", text)
    text = re.sub(r"\b\d{7,}\b", "[ID]", text)
    text = re.sub(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", "[EMAIL]", text)
    return text


def summarize_logs(text, secrets=()):
    counts = collections.Counter()
    times = {}
    lines = text.splitlines()
    for line in lines:
        timestamp, _, message = line.partition(" ")
        message = redact(message, secrets)
        if message.startswith("Read more:"):
            continue
        try:
            event = json.loads(message)
        except (ValueError, TypeError):
            event = {}
        if event.get("event") == "poll_health_heartbeat" and event.get("consecutiveFailures") == 0:
            continue
        if re.search(r'"event"\s*:\s*"completed"', message) and re.search(r'"errorCount"\s*:\s*0\b', message):
            continue
        if not re.search(r"(?i)error|warn|failed|failure|exception|unhandled|ECONN|ENOENT|ETIMEDOUT|HTTP (?:4\d\d|5\d\d)", message):
            continue
        # Normalize clocks and volatile numbers to group recurring root causes.
        message = re.sub(r"\d{4}-\d\d-\d\dT[\d:.]+(?:Z|[+-]\d\d:\d\d)", "[TIME]", message)
        message = re.sub(r"(?<![A-Za-z])\d+(?:\.\d+)?", lambda match: match[0] if re.fullmatch(r"[45]\d\d", match[0]) else "#", message)
        counts[message] += 1
        times.setdefault(message, [timestamp, timestamp])[1] = timestamp
    return {"retained_lines": len(lines), "matching_lines": sum(counts.values()),
            "classes": [{"message": message, "count": count,
                         "first": times[message][0], "last": times[message][1]}
                        for message, count in counts.most_common()]}


def run(args):
    return subprocess.run(args, capture_output=True, text=True, timeout=90)


def main():
    names = run(["docker", "ps", "-a", "--format", "{{.Names}}"])
    if names.returncode:
        raise RuntimeError("Docker inventory failed")
    selected = [name for name in names.stdout.splitlines()
                if "nexualpha-tg-" in name or "newsroom" in name or name == "rsshub"]
    inspect = run(["docker", "inspect", *selected])
    if inspect.returncode:
        raise RuntimeError("Docker inspection failed")
    containers = json.loads(inspect.stdout)
    secrets = []
    for container in containers:
        for entry in container["Config"].get("Env", []) or []:
            key, _, value = entry.partition("=")
            if re.search(r"(?i)TOKEN|PASSWORD|SECRET|KEY|AUTH|CHAT_ID|DATABASE_URL", key):
                secrets.append(value)
    evidence = {"collected_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "window": "48h; retained logs only (rotation may remove older lines)", "containers": []}
    for container in containers:
        name = container["Name"].lstrip("/")
        state, host, config = container["State"], container["HostConfig"], container["Config"]
        logs = run(["docker", "logs", "--since", "48h", "--timestamps", name])
        env = [entry.partition("=") for entry in config.get("Env", []) or []]
        evidence["containers"].append({
            "name": name, "image": config["Image"], "image_id": container["Image"],
            "working_dir": config.get("WorkingDir"),
            "entry_files": sorted(set(re.findall(r"(?:/[A-Za-z0-9._-]+)+\.(?:mjs|js|sh)", " ".join(config.get("Cmd") or [])))),
            "started_at": state["StartedAt"], "status": state["Status"],
            "restart_count": container["RestartCount"], "exit_code": state["ExitCode"],
            "oom_killed": state["OOMKilled"], "health": state.get("Health", {}).get("Status"),
            "healthcheck_configured": bool(config.get("Healthcheck")),
            "restart_policy": host["RestartPolicy"], "logging": host["LogConfig"],
            "memory_limit_bytes": host["Memory"],
            "env_keys": sorted(key for key, _, _ in env),
            "timezone": next((value for key, _, value in env if key == "TZ"), None),
            "mounts": [{key: mount.get(key) for key in ("Type", "Source", "Destination", "RW")}
                       for mount in container["Mounts"]],
            "logs_exit_code": logs.returncode,
            "logs": summarize_logs(logs.stdout + logs.stderr, secrets) if not logs.returncode else None,
        })
    print(json.dumps(evidence, indent=2))


if __name__ == "__main__":
    main()
