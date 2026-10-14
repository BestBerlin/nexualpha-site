import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location("audit", pathlib.Path(__file__).with_name("telegram-audit-readonly.py"))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class AuditTests(unittest.TestCase):
    def test_credentials_are_redacted_before_grouping(self):
        secret = "example-private-credential"
        result = audit.summarize_logs(
            f"2026-10-14T11:00:00Z error https://api.telegram.org/bot123456:abcdef/sendMessage token={secret} 123456789 user@example.com", [secret])
        message = result["classes"][0]["message"]
        for value in (secret, "abcdef", "123456789", "user@example.com", "api.telegram.org"):
            self.assertNotIn(value, message)

    def test_zero_failure_health_and_documentation_are_not_errors(self):
        result = audit.summarize_logs('\n'.join([
            '2026-10-14T11:00:00Z {"event":"poll_health_heartbeat","consecutiveFailures":0}',
            '2026-10-14T11:01:00Z [sync] {"event":"completed","errorCount":0}',
            '2026-10-14T11:02:00Z Read more: https://nextjs.org/docs/errors/example',
            '2026-10-14T11:03:00Z HTTP 503 failure',
            '2026-10-14T11:04:00Z HTTP 503 failure',
            '2026-10-14T11:05:00Z HTTP 403 failure',
        ]))
        self.assertEqual(result["matching_lines"], 3)
        self.assertEqual(len(result["classes"]), 2)
        self.assertEqual(result["classes"][0]["count"], 2)
        self.assertIn("503", result["classes"][0]["message"])
        self.assertEqual(result["classes"][0]["first"], "2026-10-14T11:03:00Z")


if __name__ == "__main__":
    unittest.main()
