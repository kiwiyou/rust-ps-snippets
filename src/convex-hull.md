# Convex Hull (Monotone Chain)

Returns up half and down half of the convex hull.

Removes straight points. change `is_ge()` (resp. `is_le()`) to `.is_gt()` (resp. `is_lt`) to contain straight points.

```rust,noplayground
fn convex_hull(sorted_pts: &[(i32, i32)]) -> (Vec<(i32, i32)>, Vec<(i32, i32)>) {
    let mut up = vec![];
    let mut len = up.len();
    for &p in &sorted_pts {
        while len >= 2 && turn(up[len - 2], up[len - 1], p).is_ge() {
            up.pop();
            len -= 1;
        }
        up.push(p);
        len += 1;
    }
    let mut down = vec![];
    let mut len = down.len();
    for &p in &sorted_pts {
        while len >= 2 && turn(down[len - 2], down[len - 1], p).is_le() {
            down.pop();
            len -= 1;
        }
        down.push(p);
        len += 1;
    }
    (up, down)
}

// Less => cw
// Greater => ccw
fn turn((ax, ay): (i32, i32), (bx, by): (i32, i32), (cx, cy): (i32, i32)) -> Ordering {
    let abx = (bx - ax) as i64;
    let aby = (by - ay) as i64;
    let bcx = (cx - bx) as i64;
    let bcy = (cy - by) as i64;
    (abx * bcy).cmp(&(aby * bcx))
}
```
