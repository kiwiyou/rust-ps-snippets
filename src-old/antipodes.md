# Antipodal Points

An iterator that yields every antipodal pairs.

```rust,noplayground
struct Antipodes<T> {
    i: usize,
    p: T,
    q: T,
    p1: T,
    q1: T,
}

impl<'a, T> Iterator for Antipodes<std::iter::Peekable<T>>
where
    T: Iterator<Item = &'a (i32, i32)> + Clone,
{
    type Item = ((i32, i32), (i32, i32));

    fn next(&mut self) -> Option<Self::Item> {
        if self.i == 0 {
            return None;
        }
        self.i -= 1;
        let p = **self.p.peek()?;
        let p1 = **self.p1.peek()?;
        let q = **self.q.peek()?;
        let q1 = **self.q1.peek()?;
        if cross(p, p1, q) < cross(p, p1, q1) {
            self.q = self.q1.clone();
            Some((**self.p.peek()?, *self.q1.next()?))
        } else {
            self.p = self.p1.clone();
            Some((*self.p1.next()?, **self.q.peek()?))
        }
    }
}

impl<'a> Antipodes<std::iter::Peekable<std::iter::Cycle<std::slice::Iter<'a, (i32, i32)>>>> {
    fn from_hull(hull: &'a [(i32, i32)]) -> Self {
        let mut base = hull.iter().cycle().peekable();
        let mut p = base.clone();
        base.next();
        let mut p1 = base.clone();
        let mut q = base.clone();
        base.next();
        let mut q1 = base;
        let pp = **p.peek().unwrap();
        let pp1 = **p1.peek().unwrap();
        while cross(pp, pp1, **q.peek().unwrap()) < cross(pp, pp1, **q1.peek().unwrap()) {
            q = q1.clone();
            q1.next();
        }
        let i = hull.len();
        Self { i, p, p1, q, q1 }
    }
}

// Less => cw
// Greater => ccw
fn turn(a: (i32, i32), b: (i32, i32), c: (i32, i32)) -> std::cmp::Ordering {
    cross(a, b, c).cmp(&0)
}

fn cross((ax, ay): (i32, i32), (bx, by): (i32, i32), (cx, cy): (i32, i32)) -> i64 {
    let abx = (bx - ax) as i64;
    let aby = (by - ay) as i64;
    let bcx = (cx - bx) as i64;
    let bcy = (cy - by) as i64;
    abx * bcy - aby * bcx
}
```
