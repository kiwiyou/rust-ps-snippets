# KMP

```rust,noplayground
struct Kmp<'a, I, T> {
    pi: Vec<u32>,
    haystack: I,
    needle: &'a [T],
    i: usize,
}

impl<'a, I, T> Kmp<'a, I, T> {
    fn new<H>(haystack: H, needle: &'a [T], pi: Vec<u32>) -> Self
    where
        H: IntoIterator<IntoIter = I>,
    {
        Self {
            pi,
            haystack: haystack.into_iter(),
            needle,
            i: 0,
        }
    }
}

impl<I, T, B> Iterator for Kmp<'_, I, T>
where
    T: PartialEq,
    B: std::borrow::Borrow<T>,
    I: Iterator<Item = B>,
{
    type Item = usize;

    fn next(&mut self) -> Option<Self::Item> {
        let c = self.haystack.next()?;
        loop {
            if self.needle.get(self.i) == Some(c.borrow()) {
                self.i += 1;
                break;
            } else if let Some(&pi) = self.pi.get(self.i.wrapping_sub(1)) {
                self.i = pi as usize;
            } else {
                break;
            }
        }
        Some(self.i)
    }
}
```

## Example

```rust,noplayground
let haystack = b"AABABAABABAA";
let needle = b"ABA";
let mut kmp = Kmp::new(&needle[1..], needle, vec![0]);
while let Some(pi) = kmp.next() {
    kmp.pi.push(pi as u32);
}
for (i, len) in Kmp::new(haystack, needle, kmp.pi).enumerate() {
    if len > 0 {
        println!("Partial match [{}, {}]", i + 1 - len, i);
    }
}
```
