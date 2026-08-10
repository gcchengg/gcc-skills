import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))

from validate_authorizations import validate_authorization


BASE = {
    "asset_id": "asset-1",
    "author_handle": "@artist",
    "source_url": "https://x.com/artist/status/1",
    "evidence_path": "authorizations/asset-1.png",
    "lofter_redistribution": True,
    "ai_adaptation": True,
    "commercial_use": False,
}


class AuthorizationTest(unittest.TestCase):
    def test_ai_adaptation_is_allowed(self):
        result = validate_authorization(BASE, "ai_adaptation")
        self.assertTrue(result["allowed"])
        self.assertEqual(result["asset_id"], "asset-1")

    def test_ai_adaptation_requires_explicit_scope(self):
        record = {**BASE, "ai_adaptation": False}
        with self.assertRaisesRegex(ValueError, "AI adaptation is not authorized"):
            validate_authorization(record, "ai_adaptation")

    def test_commercial_use_defaults_to_denied(self):
        with self.assertRaisesRegex(ValueError, "commercial use is not authorized"):
            validate_authorization(BASE, "original", commercial=True)

    def test_original_requires_lofter_permission(self):
        record = {**BASE, "lofter_redistribution": False}
        with self.assertRaisesRegex(
            ValueError, "LOFTER redistribution is not authorized"
        ):
            validate_authorization(record, "original")


if __name__ == "__main__":
    unittest.main()
