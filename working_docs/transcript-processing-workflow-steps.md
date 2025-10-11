# Transcript Processing Workflow Steps (Implementation-Agnostic)

Ordered list of functional operations suitable for automation (no user references).

1. Ingest transcript text file.
2. Read full file contents into memory.
3. Normalize line endings to "\n".
4. Remove page and line number artifacts (patterns: leading newline + optional spaces + digits + up to three spaces).
5. Persist cleaned baseline transcript state.
6. (Optional) Remove leading indentation of configured N spaces from each line start.
7. (Optional) Insert caption boundary marker token at a defined index (represents end of caption section).
8. Split transcript into caption segment and body segment using marker token.
9. In body segment, replace newline characters not followed by: "Q.", "Q", "A.", "A", or a run of >= M spaces with a single space (line break consolidation).
10. Reassemble final transcript: caption segment + single newline + transformed body segment.
11. Remove caption boundary marker token (if still present).
12. Produce output text content.
13. Generate downloadable / persisted file named with original base name plus "\_formatted" suffix.
14. (Optional) Reset processing state (clear stored file reference, inputs, and markers).

## Parameter Notes

- N: indentation space count used for indentation removal.
- M: space count threshold governing preservation of line breaks.
- Marker token: unique delimiter string (currently "🚩") identifying caption/body split point.

## Data Contracts (High-Level)

- Input: Plain text transcript file (.txt).
- Output: Plain text formatted transcript file (.txt) with suffix `_formatted`.
- Intermediate State: Baseline cleaned transcript (pre-indentation & pre-line-break processing).

## Idempotency Considerations

- Steps 4, 6, 9 are idempotent with identical parameters.
- Step 7 should guard against duplicate marker insertion.

## Error Handling (Conceptual)

- Abort if file read fails.
- Abort line-break or indentation processing if baseline text absent.
- Abort split if marker token not found when required.

## Extensibility Hooks

- Parameterize regex patterns for page/line number detection.
- Support alternative marker discovery (e.g., rule-based caption length heuristics) in Step 7.
- Allow additional Q/A style tokens in Step 9 via configuration.
