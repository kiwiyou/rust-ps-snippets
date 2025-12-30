# Convex Hull (Monotone Chain)

Returns points in convex hull in counterclockwise order.

Removes straight points. change `is_le()` to `is_lt` to contain straight points.

```rust,noplayground
fn d((ax, ay): (i32, i32), (bx, by): (i32, i32)) -> f64 {
    ((bx - ax) as f64).hypot((by - ay) as f64)
}

fn sub((ax, ay): (i32, i32), (bx, by): (i32, i32)) -> (i32, i32) {
    (ax - bx, ay - by)
}

fn cross((ax, ay): (i32, i32), (bx, by): (i32, i32)) -> i64 {
    ax as i64 * by as i64 - ay as i64 * bx as i64
}

fn convex_hull(sorted_pts: &[(i32, i32)]) -> Vec<(i32, i32)> {
    let mut hull = vec![];
    let mut len = 0;
    for &p in sorted_pts {
        while len >= 2 && turn(hull[len - 2], hull[len - 1], p).is_le() {
            hull.pop();
            len -= 1;
        }
        hull.push(p);
        len += 1;
    }
    hull.pop();
    len -= 1;
    let base = len + 2;
    for &p in sorted_pts.iter().rev() {
        while len >= base && turn(hull[len - 2], hull[len - 1], p).is_le() {
            hull.pop();
            len -= 1;
        }
        hull.push(p);
        len += 1;
    }
    hull.pop();
    hull
}
```
