# Min Heap

```rs,noplayground
struct MinHeap<T> {
    data: Vec<T>,
}

impl<T: PartialOrd> MinHeap<T> {
    fn new() -> Self {
        Self { data: vec![] }
    }
    fn peek(&self) -> Option<&T> {
        self.data.get(0)
    }
    fn push(&mut self, item: T) {
        self.data.reserve(1);
        unsafe {
            let mut i = self.data.len();
            self.data.set_len(i + 1);
            while i > 0 {
                let p = (i - 1) >> 1;
                if self.data.get_unchecked(p) <= &item {
                    break;
                }
                let ip = self.data.as_mut_ptr().add(i);
                let pp = self.data.as_ptr().add(p);
                pp.copy_to_nonoverlapping(ip, 1);
                i = p;
            }
            *self.data.get_unchecked_mut(i) = item;
        }
    }
    fn pop(&mut self) -> Option<T> {
        let comp = self.data.pop()?;
        if !self.data.is_empty() {
            unsafe {
                let item = self.data.as_ptr().add(0).read();
                let mut i = 0;
                let mut child = i << 1 | 1;
                while child + 1 < self.data.len() {
                    child += (self.data.get_unchecked(child) > self.data.get_unchecked(child + 1)) as usize;
                    if self.data.get_unchecked(child) >= &comp {
                        break;
                    }
                    let ip = self.data.as_mut_ptr().add(i);
                    let cp = self.data.as_ptr().add(child);
                    cp.copy_to_nonoverlapping(ip, 1);
                    i = child;
                    child = i << 1 | 1;
                }
                if child < self.data.len() && self.data.get_unchecked(child) < &comp {
                    let ip = self.data.as_mut_ptr().add(i);
                    let cp = self.data.as_ptr().add(child);
                    cp.copy_to_nonoverlapping(ip, 1);
                    i = child;
                }
                *self.data.get_unchecked_mut(i) = comp;
                Some(item)
            }
        } else {
            Some(comp)
        }
    }
}
```
