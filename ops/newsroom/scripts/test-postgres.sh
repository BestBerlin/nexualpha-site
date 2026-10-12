#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."
command -v docker >/dev/null || { echo 'Docker unavailable: run node --test ops/newsroom/**/*.test.mjs for static/pure checks.' >&2; exit 1; }
export NEWSROOM_TEST_PROJECT="newsroom-test-$$"
export NEWSROOM_TEST_COMPOSE="$PWD/ops/newsroom/scripts/compose.test.yml"
shim_dir=$(mktemp -d "$PWD/ops/newsroom/scripts/.psql-test-XXXXXX")
cleanup() {
  docker compose -p "$NEWSROOM_TEST_PROJECT" -f "$NEWSROOM_TEST_COMPOSE" down --volumes >/dev/null
  rm -rf "$shim_dir"
}
trap cleanup EXIT
cat > "$shim_dir/psql" <<'SHIM'
#!/usr/bin/env bash
exec docker compose -p "$NEWSROOM_TEST_PROJECT" -f "$NEWSROOM_TEST_COMPOSE" exec -T postgres psql -U newsroom_test -d newsroom "$@"
SHIM
chmod +x "$shim_dir/psql"
export PATH="$shim_dir:$PATH"
docker compose -p "$NEWSROOM_TEST_PROJECT" -f "$NEWSROOM_TEST_COMPOSE" up -d --wait
node ops/newsroom/bin/newsroom.mjs migrate
node ops/newsroom/bin/newsroom.mjs migrate
node ops/newsroom/bin/newsroom.mjs seed
node ops/newsroom/bin/newsroom.mjs seed
node ops/newsroom/bin/newsroom.mjs config:get weights
node ops/newsroom/bin/newsroom.mjs config:set test_roundtrip '{"value":"owner quote: '\''"}'
node ops/newsroom/bin/newsroom.mjs config:get test_roundtrip | node -e 'let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{if(JSON.parse(s)[0].value.value!=="owner quote: "+String.fromCharCode(39))process.exit(1)})'
node ops/newsroom/bin/newsroom.mjs shortfall:log --slot 2026-10-12T21:35:00+08:00 --wanted 2 --eligible 0 --published 0 --note 'No eligible events'
node ops/newsroom/bin/newsroom.mjs shortfall:log --slot 2026-10-12T21:35:00+08:00 --wanted 2 --eligible 1 --published 1 --note 'Updated'
psql -X --set=ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
  IF (SELECT count(*) FROM shortfall_log) <> 1 OR (SELECT published FROM shortfall_log LIMIT 1) <> 1 THEN RAISE EXCEPTION 'shortfall upsert failed'; END IF;
END $$;
INSERT INTO watchlist_entities(id,kind,display_name) VALUES ('test-venue','exchange','{"en":"Test venue"}');
INSERT INTO events(id,subject_entity,event_type,title_internal) VALUES (1,'test-venue','withdrawal_halt','Test venue withdrawals suspended'), (2,'test-venue','listing','Test listing');
INSERT INTO event_scores(event_id,scored_at,weights,editorial_score,credibility,priority_override) VALUES (1,'2026-10-12T10:00:00Z','{}',10,3,'official_major'),(2,'2026-10-12T10:00:00Z','{}',90,2,NULL),(2,'2026-10-12T11:00:00Z','{}',20,2,NULL);
INSERT INTO event_evidence(event_id,url,kind) VALUES (1,'https://example.test/notice','official_notice');
INSERT INTO review_queue(event_id,reason,rule_ids) VALUES (1,'Test review','{G1}');
SQL
node ops/newsroom/bin/newsroom.mjs events:top --limit 2 | node -e 'let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s);if(r.length!==2||r[0].id!==1||r[1].score.editorial_score!==20)process.exit(1)})'
node ops/newsroom/bin/newsroom.mjs event:show 1 | node -e 'let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{if(JSON.parse(s)[0].evidence.length!==1)process.exit(1)})'
node ops/newsroom/bin/newsroom.mjs review:list | node -e 'let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{if(JSON.parse(s).length!==1)process.exit(1)})'
node --test ops/newsroom/**/*.test.mjs
echo 'Postgres migrations twice, seed twice, CLI roundtrip and pure tests passed.'
