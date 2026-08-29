import re
import unittest
from datetime import date, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CALENDAR = ROOT / "references" / "content-calendar.md"
ROW = re.compile(
    r"^\| (D\d{2}) \| (\d{4}-\d{2}-\d{2}) \| "
    r"(.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|$"
)
ALLOWED_TEMPLATES = {
    "time-spiral", "food-arena", "meal-assembly", "contrast-worlds"
}
BANNED = {"预防脑梗", "清理血管", "降三高", "抗癌食物", "治疗便秘"}


class CalendarContractTest(unittest.TestCase):
    def test_calendar_has_30_consecutive_days_and_60_unique_posts(self):
        rows = []
        for line in CALENDAR.read_text(encoding="utf-8").splitlines():
            match = ROW.match(line)
            if match:
                rows.append(match.groups())

        self.assertEqual(30, len(rows))
        expected_dates = [
            (date(2026, 8, 18) + timedelta(days=i)).isoformat()
            for i in range(30)
        ]
        self.assertEqual(expected_dates, [row[1] for row in rows])

        titles = [title for row in rows for title in (row[2], row[5])]
        self.assertEqual(60, len(titles))
        self.assertEqual(60, len(set(titles)))

        content_types = [kind for row in rows for kind in (row[3], row[6])]
        self.assertEqual(24, content_types.count("health-list"))
        self.assertEqual(5, content_types.count("myth"))

        templates = [template for row in rows for template in (row[4], row[7])]
        self.assertTrue(set(templates) <= ALLOWED_TEMPLATES)
        self.assertFalse(any(term in title for title in titles for term in BANNED))


if __name__ == "__main__":
    unittest.main()
