# Antipodal Points

An iterator that yields every antipodal pairs.

```rust,noplayground
struct Antipodes<'a> {
    hull: &'a [(i32, i32)],
    p0: usize,
    q0: usize,
    p: usize,
    q: usize,
    first: Option<bool>,
}

impl Iterator for Antipodes<'_> {
    type Item = ((i32, i32), (i32, i32));

    fn next(&mut self) -> Option<Self::Item> {
        use std::cmp::Ordering::*;
        if !self.first? {
            loop {
                match area(
                    self.hull[self.p],
                    self.hull[self.next_index(self.p)],
                    self.hull[self.next_index(self.q)],
                )
                .cmp(&area(
                    self.hull[self.p],
                    self.hull[self.next_index(self.p)],
                    self.hull[self.q],
                )) {
                    Less => break,
                    Equal => {
                        self.first = Some(true);
                        if (self.p, self.q) != (self.q0, self.p0) {
                            return Some((self.hull[self.p], self.hull[self.next_index(self.q)]));
                        } else {
                            return Some((self.hull[self.next_index(self.p)], self.hull[self.q]));
                        }
                    }
                    Greater => {
                        self.q = self.next_index(self.q);
                        if (self.p, self.q) != (self.q0, self.p0) {
                            return Some((self.hull[self.p], self.hull[self.q]));
                        } else {
                            self.first = None;
                            return None;
                        }
                    }
                }
            }
        }
        if self.p == self.q0 {
            self.first = None;
            None
        } else {
            self.first = Some(false);
            self.p = self.next_index(self.p);
            Some((self.hull[self.p], self.hull[self.q]))
        }
    }
}

impl<'a> Antipodes<'a> {
    fn new(hull: &'a [(i32, i32)]) -> Self {
        let mut this = Self {
            hull,
            p: 0,
            q: 0,
            p0: hull.len() - 1,
            q0: 0,
            first: Some(true),
        };
        this.init();
        this
    }
    fn next_index(&self, i: usize) -> usize {
        if i + 1 >= self.hull.len() {
            0
        } else {
            i + 1
        }
    }
    fn init(&mut self) {
        let mut q = self.next_index(self.p);
        while area(
            self.hull[self.p],
            self.hull[self.next_index(self.p)],
            self.hull[self.next_index(q)],
        ) > area(
            self.hull[self.p],
            self.hull[self.next_index(self.p)],
            self.hull[q],
        ) {
            q = self.next_index(q);
        }
        self.q = q;
        self.q0 = q;
    }
}

// Double triangle area, input in ccw order
fn area(a: (i32, i32), b: (i32, i32), c: (i32, i32)) -> i64 {
    a.0 as i64 * b.1 as i64 + b.0 as i64 * c.1 as i64 + c.0 as i64 * a.1 as i64
        - a.1 as i64 * b.0 as i64
        - b.1 as i64 * c.0 as i64
        - c.1 as i64 * a.0 as i64
}
```
