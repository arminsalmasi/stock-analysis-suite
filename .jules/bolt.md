## 2024-05-17 - Jupyter Notebook Optimizations
**Learning:** Python operations on arrays in jupyter notebooks can be sped up significantly by avoiding explicit `for` loops with `append()` calls. Standard operations like `list(range(len(x)))` instead of manual iteration perform much faster at scale.
**Action:** When I encounter `for` loops constructing integer indices or other sequences manually, I should consider built-in functions like `list(range(...))` or dictionary/list comprehensions for significant speed boosts.
