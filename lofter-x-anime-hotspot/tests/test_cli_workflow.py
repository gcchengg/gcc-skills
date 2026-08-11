import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SKILL_DIR = Path(__file__).parents[1]
SCRIPTS_DIR = SKILL_DIR / "scripts"
TEMPLATES_DIR = SKILL_DIR / "templates"


def run_cli(*arguments, cwd):
    return subprocess.run(
        [sys.executable, *map(str, arguments)],
        cwd=cwd,
        text=True,
        capture_output=True,
        check=False,
    )


class CliWorkflowTest(unittest.TestCase):
    def test_exact_examples_complete_end_to_end_from_another_directory(self):
        with tempfile.TemporaryDirectory() as temp_value:
            temp_dir = Path(temp_value)
            ranked_path = temp_dir / "ranked.json"
            authorization_path = temp_dir / "authorization.json"
            packet_input_path = temp_dir / "packet-input.json"
            packet_path = temp_dir / "packet.md"

            score = run_cli(
                SCRIPTS_DIR / "score_candidates.py",
                TEMPLATES_DIR / "candidates.example.json",
                "--ip-pool",
                TEMPLATES_DIR / "ip-pool.example.json",
                "--output",
                ranked_path,
                cwd=temp_dir,
            )
            self.assertEqual(score.returncode, 0, score.stderr)
            ranked = json.loads(ranked_path.read_text(encoding="utf-8"))
            self.assertGreater(len(ranked), 5)

            authorization = run_cli(
                SCRIPTS_DIR / "validate_authorizations.py",
                TEMPLATES_DIR / "authorizations.example.json",
                "example-asset-adapted-1",
                "--usage",
                "ai_adaptation",
                "--operation",
                "layout",
                cwd=temp_dir,
            )
            self.assertEqual(authorization.returncode, 0, authorization.stderr)
            authorization_path.write_text(authorization.stdout, encoding="utf-8")
            decision = json.loads(authorization.stdout)

            pool = json.loads(
                (TEMPLATES_DIR / "ip-pool.example.json").read_text(encoding="utf-8")
            )
            candidate = next(
                item for item in ranked if item["asset_id"] == decision["asset_id"]
            )
            payload = {
                "column": "daily_hotspot",
                "ip_pool": pool,
                "candidate": candidate,
                "authorization": decision,
                "authorization_ledger_path": str(
                    TEMPLATES_DIR / "authorizations.example.json"
                ),
            }
            packet_input_path.write_text(
                json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
            )

            packet = run_cli(
                SCRIPTS_DIR / "build_content_packet.py",
                packet_input_path,
                "--output",
                packet_path,
                cwd=temp_dir,
            )
            self.assertEqual(packet.returncode, 0, packet.stderr)
            text = packet_path.read_text(encoding="utf-8")
            self.assertIn("# 人工审核内容包｜今日热度异动", text)
            self.assertIn("图像经授权使用，含AI辅助创作｜#AI辅助#", text)
            self.assertEqual(text.count("互动问题："), 1)

    def test_cli_failures_are_nonzero_and_explain_the_rejection(self):
        with tempfile.TemporaryDirectory() as temp_value:
            temp_dir = Path(temp_value)
            pool_path = TEMPLATES_DIR / "ip-pool.example.json"
            candidates = json.loads(
                (TEMPLATES_DIR / "candidates.example.json").read_text(encoding="utf-8")
            )
            candidates[0]["ip_id"] = "forged-ip"
            invalid_candidates = temp_dir / "invalid-candidates.json"
            invalid_candidates.write_text(
                json.dumps(candidates, ensure_ascii=False), encoding="utf-8"
            )
            score = run_cli(
                SCRIPTS_DIR / "score_candidates.py",
                invalid_candidates,
                "--ip-pool",
                pool_path,
                cwd=temp_dir,
            )
            self.assertNotEqual(score.returncode, 0)
            self.assertIn("unknown ip_id", score.stderr)

            ledger = json.loads(
                (TEMPLATES_DIR / "authorizations.example.json").read_text(
                    encoding="utf-8"
                )
            )
            evidence_dir = TEMPLATES_DIR / "evidence"
            for record in ledger:
                record["evidence_path"] = str(
                    evidence_dir / Path(record["evidence_path"]).name
                )
            ledger.append(dict(ledger[0]))
            duplicate_ledger = temp_dir / "duplicate-ledger.json"
            duplicate_ledger.write_text(
                json.dumps(ledger, ensure_ascii=False), encoding="utf-8"
            )
            authorization = run_cli(
                SCRIPTS_DIR / "validate_authorizations.py",
                duplicate_ledger,
                ledger[0]["asset_id"],
                "--usage",
                "original",
                cwd=temp_dir,
            )
            self.assertNotEqual(authorization.returncode, 0)
            self.assertIn("duplicate asset_id", authorization.stderr)

            examples = json.loads(
                (TEMPLATES_DIR / "packet-inputs.example.json").read_text(
                    encoding="utf-8"
                )
            )
            forged = dict(examples["daily_hotspot"])
            forged["candidate"] = dict(forged["candidate"])
            forged["candidate"].update(
                {
                    "asset_id": "forged-asset",
                    "requested_usage": "original",
                    "image_provenance": "authorized_original",
                }
            )
            forged["authorization"] = {"allowed": True}
            forged_path = temp_dir / "forged-packet.json"
            forged_path.write_text(
                json.dumps(forged, ensure_ascii=False), encoding="utf-8"
            )
            packet = run_cli(
                SCRIPTS_DIR / "build_content_packet.py",
                forged_path,
                "--output",
                temp_dir / "packet.md",
                cwd=temp_dir,
            )
            self.assertNotEqual(packet.returncode, 0)
            self.assertIn("validated authorization output is incomplete", packet.stderr)

    def test_each_packet_example_is_a_valid_column_shape(self):
        sys.path.insert(0, str(SCRIPTS_DIR))
        from build_content_packet import build_packet

        examples = json.loads(
            (TEMPLATES_DIR / "packet-inputs.example.json").read_text(encoding="utf-8")
        )
        self.assertEqual(
            set(examples),
            {"daily_hotspot", "weekly_trend", "media_curation", "fanfic"},
        )
        for column, payload in examples.items():
            with self.subTest(column=column):
                packet = build_packet(payload)
                self.assertEqual(packet.count("互动问题："), 1)


if __name__ == "__main__":
    unittest.main()
