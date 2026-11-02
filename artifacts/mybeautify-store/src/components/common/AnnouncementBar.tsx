import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';

const ANNOUNCEMENTS = [
  'Discover your next signature piece',
  'Explore timeless MALKAZ collections',
  'Jewellery for moments worth keeping',
];

export function AnnouncementBar() {
  const [activeAnnouncement, setActiveAnnouncement] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveAnnouncement((index) => (index + 1) % ANNOUNCEMENTS.length);
    }, 3600);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="mz-announcement-bar">
      <span className="mz-announcement-sparkle" aria-hidden="true">✦</span>
      <span className="mz-announcement-copy" key={activeAnnouncement}>
        {ANNOUNCEMENTS[activeAnnouncement]}
      </span>
      <Link href="/sign-in" className="mz-announcement-join">
        Join MALKAZ <ArrowRight size={13} aria-hidden="true" />
      </Link>
      <span className="mz-announcement-sparkle" aria-hidden="true">✦</span>
    </div>
  );
}

export default AnnouncementBar;
