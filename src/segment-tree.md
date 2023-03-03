# Segment Tree

```rust,noplayground
struct SegTree<C, A, T> {
    e: T,
    v: Vec<T>,
    offset: usize,
    n: usize,
    combine: C,
    apply: A,
}

impl<C, A, T> SegTree<C, A, T>
where
    T: Copy,
    C: Fn(T, T) -> T,
{
    fn new<I>(n: usize, e: T, combine: C, apply: A, init: I) -> Self
    where
        I: IntoIterator<Item = T>,
    {
        let offset = n.next_power_of_two();
        let mut v = vec![e; offset];
        v.extend(init.into_iter().take(n));
        v.resize(offset * 2, e);
        for i in (1..offset).rev() {
            v[i] = combine(v[i << 1], v[i << 1 | 1]);
        }
        Self {
            e,
            v,
            offset,
            n,
            combine,
            apply,
        }
    }

    fn query<B: std::ops::RangeBounds<usize>>(&self, range: B) -> T {
        use std::ops::Bound::*;
        let mut l = self.offset
            + match range.start_bound() {
                Included(&x) => x,
                Excluded(&x) => x + 1,
                Unbounded => 0,
            };
        let mut r = self.offset
            + match range.end_bound() {
                Included(&x) => x + 1,
                Excluded(&x) => x,
                Unbounded => self.n,
            };
        let mut lsum = self.e;
        let mut rsum = self.e;
        while l < r {
            if l & 1 != 0 {
                lsum = (self.combine)(lsum, self.v[l]);
                l += 1;
            }
            if r & 1 != 0 {
                r -= 1;
                rsum = (self.combine)(self.v[r], rsum);
            }
            l >>= 1;
            r >>= 1;
        }
        (self.combine)(lsum, rsum)
    }

    fn update<U>(&mut self, mut i: usize, u: U)
    where
        U: Copy,
        A: Fn(&mut T, U),
    {
        i += self.offset;
        (self.apply)(&mut self.v[i], u);
        while i > 1 {
            i >>= 1;
            self.v[i] = (self.combine)(self.v[i << 1], self.v[i << 1 | 1]);
        }
    }

    fn partition_point<P: Fn(T) -> bool>(&self, pred: P) -> usize {
        let mut p = 1;
        if pred(self.v[p]) {
            self.n
        } else {
            let mut pivot = self.e;
            while p < self.offset {
                p <<= 1;
                let test = (self.combine)(pivot, self.v[p]);
                if pred(test) {
                    pivot = test;
                    p |= 1;
                }
            }
            p - self.offset
        }
    }
}
```
