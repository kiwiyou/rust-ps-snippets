# Matrix

```rust,noplayground
struct Matrix<T>(Vec<T>, usize);

impl<T> std::ops::Index<usize> for Matrix<T> {
    type Output = [T];
    fn index(&self, index: usize) -> &Self::Output {
        &self.0[index * self.1..][..self.1]
    }
}

impl<T> std::ops::IndexMut<usize> for Matrix<T> {
    fn index_mut(&mut self, index: usize) -> &mut Self::Output {
        &mut self.0[index * self.1..][..self.1]
    }
}
```
