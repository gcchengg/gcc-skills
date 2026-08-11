import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))

from validate_authorizations import validate_authorization, validate_ledger


def authorization_record(**overrides):
    value = {
        "asset_id": "asset-original-1",
        "author_handle": "@artist",
        "source_url": "https://x.com/artist/status/1",
        "evidence_path": "evidence/asset-original-1.txt",
        "lofter_redistribution": True,
        "ai_adaptation": True,
        "commercial_use": False,
        "translation": True,
        "crop": True,
        "layout": True,
        "allowed_platforms": ["LOFTER"],
        "attribution_mode": "public",
        "original_asset_id": None,
        "derived_asset_ids": [],
        "publication_history": [
            {
                "published_at": "2026-08-09",
                "lofter_url": "https://www.lofter.com/post/example",
            }
        ],
        "example_only": False,
    }
    value.update(overrides)
    return value


class AuthorizationTest(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        evidence = self.root / "evidence" / "asset-original-1.txt"
        evidence.parent.mkdir()
        evidence.write_text("example evidence", encoding="utf-8")

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_complete_original_authorization_is_allowed(self):
        result = validate_authorization(
            authorization_record(),
            "original",
            operations=("translation", "crop"),
            evidence_root=self.root,
        )
        self.assertIs(result["allowed"], True)
        self.assertEqual(result["asset_id"], "asset-original-1")
        self.assertEqual(result["requested_usage"], "original")
        self.assertIs(result["commercial_intent"], False)
        self.assertEqual(result["source_url"], "https://x.com/artist/status/1")
        self.assertEqual(result["author_handle"], "@artist")
        self.assertEqual(result["attribution_mode"], "public")
        self.assertEqual(result["platform"], "LOFTER")

    def test_rejects_truthy_or_null_permission_values(self):
        for field in (
            "lofter_redistribution",
            "ai_adaptation",
            "commercial_use",
            "translation",
            "crop",
            "layout",
        ):
            for malformed in ("false", 1, None):
                with self.subTest(field=field, malformed=malformed):
                    with self.assertRaisesRegex(ValueError, f"{field} must be a boolean"):
                        validate_authorization(
                            authorization_record(**{field: malformed}),
                            "original",
                            evidence_root=self.root,
                        )

    def test_rejects_empty_identifiers_and_invalid_urls(self):
        cases = (
            (authorization_record(asset_id=""), "asset_id must be a non-empty string"),
            (authorization_record(author_handle=None), "author_handle must be a non-empty string"),
            (authorization_record(source_url="http://x.com/a"), "source_url must be an HTTPS URL"),
            (authorization_record(evidence_path=""), "evidence_path must be a non-empty string"),
            (
                authorization_record(
                    publication_history=[
                        {"published_at": "yesterday", "lofter_url": "https://www.lofter.com/post/a"}
                    ]
                ),
                "published_at must be ISO-8601",
            ),
            (
                authorization_record(
                    publication_history=[
                        {"published_at": "2026-08-09", "lofter_url": "http://www.lofter.com/post/a"}
                    ]
                ),
                "lofter_url must be an HTTPS LOFTER URL",
            ),
        )
        for record, message in cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    validate_authorization(record, "original", evidence_root=self.root)

    def test_rejects_missing_evidence_file(self):
        with self.assertRaisesRegex(ValueError, "authorization evidence does not exist"):
            validate_authorization(
                authorization_record(evidence_path="evidence/missing.txt"),
                "original",
                evidence_root=self.root,
            )

    def test_requires_lofter_platform_and_redistribution_scope(self):
        cases = (
            (
                authorization_record(allowed_platforms=["OTHER"]),
                "LOFTER is not in allowed_platforms",
            ),
            (
                authorization_record(lofter_redistribution=False),
                "LOFTER redistribution is not authorized",
            ),
        )
        for record, message in cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    validate_authorization(record, "original", evidence_root=self.root)

    def test_rejects_unauthorized_requested_operations(self):
        for operation in ("translation", "crop", "layout"):
            with self.subTest(operation=operation):
                record = authorization_record(**{operation: False})
                with self.assertRaisesRegex(
                    ValueError, f"{operation} is not authorized"
                ):
                    validate_authorization(
                        record,
                        "original",
                        operations=(operation,),
                        evidence_root=self.root,
                    )

    def test_rejects_ai_commercial_and_lineage_mismatches(self):
        cases = (
            (
                authorization_record(ai_adaptation=False, original_asset_id="source-1"),
                "AI adaptation is not authorized",
                "ai_adaptation",
                False,
            ),
            (
                authorization_record(),
                "commercial use is not authorized",
                "original",
                True,
            ),
            (
                authorization_record(original_asset_id="source-1"),
                "original usage requires an original asset record",
                "original",
                False,
            ),
            (
                authorization_record(),
                "ai_adaptation usage requires a derived asset record",
                "ai_adaptation",
                False,
            ),
        )
        for record, message, usage, commercial in cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    validate_authorization(
                        record,
                        usage,
                        commercial=commercial,
                        evidence_root=self.root,
                    )

    def test_rejects_invalid_attribution_and_lineage_shapes(self):
        cases = (
            (authorization_record(attribution_mode="sometimes"), "invalid attribution_mode"),
            (authorization_record(original_asset_id=""), "original_asset_id must be null or a non-empty string"),
            (authorization_record(derived_asset_ids=[""]), "derived_asset_ids must contain non-empty strings"),
            (authorization_record(publication_history={}), "publication_history must be a list"),
        )
        for record, message in cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    validate_authorization(record, "original", evidence_root=self.root)

    def test_ledger_rejects_duplicate_asset_ids(self):
        with self.assertRaisesRegex(ValueError, "duplicate asset_id: asset-original-1"):
            validate_ledger(
                [authorization_record(), authorization_record()],
                evidence_root=self.root,
            )

    def test_ledger_validates_derived_relationships(self):
        derived_evidence = self.root / "evidence" / "asset-derived-1.txt"
        derived_evidence.write_text("derived evidence", encoding="utf-8")
        original = authorization_record(derived_asset_ids=["asset-derived-1"])
        derived = authorization_record(
            asset_id="asset-derived-1",
            evidence_path="evidence/asset-derived-1.txt",
            original_asset_id="asset-original-1",
            derived_asset_ids=[],
        )
        indexed = validate_ledger([original, derived], evidence_root=self.root)
        self.assertEqual(set(indexed), {"asset-original-1", "asset-derived-1"})

    def test_normal_validation_rejects_example_only_records(self):
        record = authorization_record(example_only=True)
        with self.assertRaisesRegex(
            ValueError, "example-only authorization is forbidden outside smoke mode"
        ):
            validate_ledger([record], evidence_root=self.root)
        with self.assertRaisesRegex(
            ValueError, "example-only authorization is forbidden outside smoke mode"
        ):
            validate_authorization(record, "original", evidence_root=self.root)

    def test_explicit_smoke_mode_marks_decision_as_publication_forbidden(self):
        record = authorization_record(example_only=True)
        indexed = validate_ledger(
            [record], evidence_root=self.root, allow_example_only=True
        )
        decision = validate_authorization(
            indexed["asset-original-1"],
            "original",
            evidence_root=self.root,
            smoke_only=True,
        )
        self.assertIs(decision["smoke_only"], True)
        self.assertIs(decision["publication_forbidden"], True)
        self.assertIn("EXAMPLE ONLY", decision["publication_warning"])

    def test_enum_values_require_strings(self):
        with self.assertRaisesRegex(ValueError, "attribution_mode must be a string"):
            validate_authorization(
                authorization_record(attribution_mode={}),
                "original",
                evidence_root=self.root,
            )
        with self.assertRaisesRegex(ValueError, "usage must be a string"):
            validate_authorization(
                authorization_record(), [], evidence_root=self.root
            )
        with self.assertRaisesRegex(
            ValueError, "requested operation must be a string"
        ):
            validate_authorization(
                authorization_record(),
                "original",
                operations=[{}],
                evidence_root=self.root,
            )


if __name__ == "__main__":
    unittest.main()
