export default function LandingPageLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <>
        <div>{children}</div>
      </>
    );
  }