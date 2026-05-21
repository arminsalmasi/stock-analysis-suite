## 2024-05-24 - Avoid dictionary key mutation during iteration
**Learning:** Mutating dictionary keys during iteration (e.g., `for k in d.keys(): d[new_k] = d.pop(k)`) is not only slow but raises a `RuntimeError` in Python 3. Vectorized Pandas operations are faster and safer.
**Action:** Replace dictionary iteration loops with native Pandas operations (e.g., `data.index.strftime('%Y-%m-%d')`) before converting DataFrames to dictionaries.
