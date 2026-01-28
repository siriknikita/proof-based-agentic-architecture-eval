You are given a stream of raw vendor records representing product updates.
Each record may be malformed, partially valid, duplicated, or out of order.

Your task is to design and implement a data transformation pipeline that:

1. Accepts raw records
2. Sanitizes malformed fields
3. Validates semantic correctness
4. Deduplicates records deterministically
5. Produces a canonical, ordered output stream

Requirements:

- The pipeline must be deterministic.
- All failure cases must be explicit.
- No silent data loss is allowed.
- Each transformation step must be independently testable.
- The system must be extensible to new vendors without modifying existing logic.

Deliverables:

- A clear design
- The full implementation
- Explanation of decisions

Constraints:

- Do not assume inputs are well-formed.
- Do not optimize prematurely.
- Do not skip steps.

Language: TypeScript (Node.js)
