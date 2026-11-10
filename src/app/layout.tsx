// The real root layout (html/body) is src/app/[locale]/layout.tsx; this one only exists so
// that src/app/not-found.tsx can render for paths outside the locale segment.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return children;
}
