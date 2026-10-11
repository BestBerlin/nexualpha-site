"""Verify the level-10 network-check export (use verify_season.py for all twelve)."""
import json
import engine
from verify_season import verify

if __name__ == '__main__':
    path = engine.ROOT/'episodes/10-check-network-before-withdraw.json'
    verify(engine.ROOT/'samples/season1'/path.stem, json.loads(path.read_text()))
