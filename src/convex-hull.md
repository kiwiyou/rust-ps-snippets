# Convex Hull (Monotone Chain)

Returns points in convex hull in clockwise order.

Removes straight points. change `is_ge()` (resp. `is_le()`) to `.is_gt()` (resp. `is_lt`) to contain straight points.

```rust,noplayground
fn convex_hull(sorted_pts: &[(i32, i32)]) -> Vec<(i32, i32)> {
    let mut hull = vec![];
    let mut len = 0;
    for &p in sorted_pts.iter() {
        while len >= 2 && turn(hull[len - 2], hull[len - 1], p).is_ge() {
            hull.pop();
            len -= 1;
        }
        hull.push(p);
        len += 1;
    }
    let up = len;
    let mut len = 0;
    for &p in sorted_pts.iter() {
        while len >= 2 && turn(hull[up + len - 2], hull[up + len - 1], p).is_le() {
            hull.pop();
            len -= 1;
        }
        hull.push(p);
        len += 1;
    }
    let mut offset = 0;
    let mut j = 0;
    for i in up..hull.len() {
        let p = hull[i];
        hull[i - offset] = p;
        while j < up {
            match hull[j].cmp(&p) {
                std::cmp::Ordering::Less => j += 1,
                std::cmp::Ordering::Equal => {
                    offset += 1;
                    break;
                }
                std::cmp::Ordering::Greater => break,
            }
        }
    }
    hull.truncate(hull.len() - offset);
    hull[up..].reverse();
    hull
}

// Less => cw
// Greater => ccw
fn turn((ax, ay): (i32, i32), (bx, by): (i32, i32), (cx, cy): (i32, i32)) -> std::cmp::Ordering {
    let abx = (bx - ax) as i64;
    let aby = (by - ay) as i64;
    let bcx = (cx - bx) as i64;
    let bcy = (cy - by) as i64;
    (abx * bcy).cmp(&(aby * bcx))
}
```
