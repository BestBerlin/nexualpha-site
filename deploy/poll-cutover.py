"""Poll / every 200 ms around a supplied cutover command; no deployment defaults."""
import argparse
import subprocess
import sys
import threading
import time
import urllib.request


def monitor(url, stop, samples):
    deadline = time.monotonic()
    while not stop.is_set():
        started = time.monotonic()
        try:
            with urllib.request.urlopen(url, timeout=4) as response:
                status = response.status
        except Exception as error:
            status = str(error)
        samples.append((started, status))
        print('%.3f %s' % (started, status), flush=True)
        deadline += 0.2
        stop.wait(max(0, deadline - time.monotonic()))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('url', help='Home URL, including trailing /')
    parser.add_argument('command', nargs=argparse.REMAINDER, help='-- command [args...]')
    args = parser.parse_args()
    command = args.command[1:] if args.command[:1] == ['--'] else args.command
    if not command:
        parser.error('a cutover command is required')
    stop, samples, cutover_from = threading.Event(), [], 0
    thread = threading.Thread(target=monitor, args=(args.url, stop, samples))
    thread.start()
    result = 1
    try:
        # Baseline: wait up to 20 s for 3 consecutive 200s (one slow first request from a busy laptop used to abort
        # the whole deploy twice on 2026-10-19). Only samples taken after the baseline passes count as cutover failures.
        baseline_ok, deadline = False, time.monotonic() + 20
        while time.monotonic() < deadline:
            time.sleep(0.25)
            tail = [status for _, status in samples[-3:]]
            if len(tail) == 3 and all(status == 200 for status in tail):
                baseline_ok = True
                break
        if not baseline_ok:
            print('ABORT baseline is not consistently 200', file=sys.stderr)
        else:
            cutover_from = len(samples)
            result = subprocess.call(command)
            time.sleep(3)
    finally:
        stop.set()
        thread.join()
    failures = [(timestamp, status) for timestamp, status in samples[cutover_from:] if status != 200]
    print('samples=%d non_200=%d command_exit=%d' % (len(samples), len(failures), result))
    return 1 if failures else result


if __name__ == '__main__':
    sys.exit(main())
