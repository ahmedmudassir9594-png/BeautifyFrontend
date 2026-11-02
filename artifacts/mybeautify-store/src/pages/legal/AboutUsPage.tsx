import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { SiteLayout } from '@/layouts/SiteLayout';
import './privacy-conditions.css';

export default function AboutUsPage() {
  return (
    <SiteLayout>
      <main className="page legal-page about-page">
        <Link href="/" className="legal-back-link">
          <ArrowLeft size={15} aria-hidden="true" />
          Back to MALKAZ
        </Link>

        <header className="legal-page-heading">
          <p className="eyebrow">MALKAZ / OUR STORY</p>
          <h1 className="page-title">About Us</h1>
          <p>
            Jewellery is more than an accessory; it is a way to celebrate
            personal style, meaningful moments, and stories worth keeping.
          </p>
        </header>

        <section className="about-story" aria-labelledby="about-story-title">
          <div className="about-story-mark" aria-hidden="true">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="eyebrow">THOUGHTFULLY CHOSEN</p>
            <h2 id="about-story-title">Made for your story</h2>
            <p>
              MALKAZ brings together jewellery for the moments that matter and
              the everyday in between. Our collection includes distinctive
              designs inspired by timeless elegance, so you can find a piece
              that feels like you—whether you are choosing a gift or treating
              yourself.
            </p>
            <p>
              We want discovering jewellery to feel clear and considered, from
              browsing the collection to getting help with an order. Thank you
              for making MALKAZ part of your story.
            </p>
            <Link href="/shop" className="about-shop-link">
              Explore the collection <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section
          className="about-privacy-section"
          id="privacy-conditions"
          aria-labelledby="about-privacy-title"
        >
          <p className="eyebrow">CUSTOMER INFORMATION</p>
          <h2 id="about-privacy-title">Privacy &amp; Conditions</h2>
          <p>
            Your privacy matters to us. This section explains how information
            is used when you browse, create an account, or place an order, and
            the conditions for using this website.
          </p>
          <Link href="/privacy-conditions" className="about-shop-link">
            Read Privacy &amp; Conditions <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </main>
    </SiteLayout>
  );
}
