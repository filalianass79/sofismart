import fs from "fs";
const wrong = "motionLabelBlockInner";
const files = ["src/components/clients/client-detail-view.tsx"];
for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  const before = (s.match(new RegExp(wrong, "g")) || []).length;
  s = s.replaceAll(wrong, "div");
  fs.writeFileSync(f, s);
  console.log(f, "fixed", before, "occurrences");
}
