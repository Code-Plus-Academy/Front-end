export default function TwoColumn({ main, sidebar, sidebarPosition = 'right' }) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {sidebarPosition === 'left' && (
        <aside className="w-full lg:w-1/3 hide-mobile">{sidebar}</aside>
      )}
      <main className="w-full lg:w-2/3">{main}</main>
      {sidebarPosition === 'right' && (
        <aside className="w-full lg:w-1/3 hide-mobile">{sidebar}</aside>
      )}
    </div>
  );
}
