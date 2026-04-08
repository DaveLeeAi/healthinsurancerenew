"""
iowa_mvp/guardrails.py — Python reference guardrails for the Iowa MVP.

Mirrors the TypeScript guardrails in lib/iowa-mvp/guardrails.ts.
"""

import re
from dataclasses import dataclass

GUARANTEE_PATTERNS = [
    re.compile(r"\bguaranteed?\b", re.I),
    re.compile(r"\bdefinitely covered\b", re.I),
    re.compile(r"\bdefinitely in[- ]network\b", re.I),
    re.compile(r"\byou will be approved\b", re.I),
    re.compile(r"\bexact cost will be\b", re.I),
    re.compile(r"\bwill definitely\b", re.I),
    re.compile(r"\b100% certain\b", re.I),
    re.compile(r"\bwe guarantee\b", re.I),
    re.compile(r"\bpromise you\b", re.I),
    re.compile(r"\bassured\b", re.I),
]

ENROLLMENT_ADVICE_PATTERNS = [
    re.compile(r"\byou should enroll\b", re.I),
    re.compile(r"\bapply now\b", re.I),
    re.compile(r"\benroll now\b", re.I),
    re.compile(r"\bsign up (?:now|today|immediately)\b", re.I),
    re.compile(r"\bthis is the best plan for you\b", re.I),
    re.compile(r"\bthe best plan\b", re.I),
    re.compile(r"\bthe only plan you need\b", re.I),
    re.compile(r"\bwe recommend you choose\b", re.I),
    re.compile(r"\byou must select\b", re.I),
]

UNSUPPORTED_CLAIM_PATTERNS = [
    re.compile(r"\byour doctor (?:is|will be) in[- ]network\b", re.I),
    re.compile(r"\byour pharmacy (?:is|will) cover\b", re.I),
    re.compile(r"\byour exact (?:premium|cost|price) (?:is|will be)\b", re.I),
    re.compile(r"\byou will (?:save|pay) exactly\b", re.I),
    re.compile(r"\byour subsidy (?:is|will be) exactly\b", re.I),
]

DISCRIMINATORY_PATTERNS = [
    re.compile(r"\bpeople (?:like you|in your area|with your income) (?:should|deserve|only need)\b", re.I),
    re.compile(r"\bbased on your (?:neighborhood|zip code|race|gender|ethnicity)\b", re.I),
    re.compile(r"\byou (?:only )?deserve\b", re.I),
    re.compile(r"\blower[- ]income (?:people|individuals) should (?:accept|settle)\b", re.I),
]


@dataclass
class Violation:
    category: str
    pattern: str
    matched_text: str


def validate_text(text: str) -> list[Violation]:
    """Check text for guardrail violations. Returns list of violations."""
    violations: list[Violation] = []

    def check(patterns: list[re.Pattern[str]], category: str) -> None:
        for p in patterns:
            m = p.search(text)
            if m:
                violations.append(Violation(category, p.pattern, m.group()))

    check(GUARANTEE_PATTERNS, "guarantee")
    check(ENROLLMENT_ADVICE_PATTERNS, "enrollment_advice")
    check(UNSUPPORTED_CLAIM_PATTERNS, "unsupported_claim")
    check(DISCRIMINATORY_PATTERNS, "discriminatory")

    return violations


def is_text_safe(text: str) -> bool:
    """Return True if text passes all guardrails."""
    return len(validate_text(text)) == 0
