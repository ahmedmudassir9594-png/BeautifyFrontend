import { useState, useRef, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Layers,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  fetchAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  toggleAdminBannerStatus,
  deleteAdminBanner,
  fetchAdminShowcaseImages,
  createAdminShowcaseImage,
  updateAdminShowcaseImage,
  toggleAdminShowcaseStatus,
  deleteAdminShowcaseImage,
  reorderAdminShowcaseImages,
} from '@/services/banners/banners.service';
import { uploadImage } from '@/services/uploads/uploads.service';
import { resolveImageUrl, handleImageError } from '@/lib/jewellery-images';
import { normalizeList } from '@/utils/array';
import type { HeroBanner, HeroBannerRequest, ShowcaseImage, ShowcaseImageRequest } from '@/types/banner.types';

const EMPTY_BANNER_FORM: HeroBannerRequest = {
  title: '',
  subtitle: '',
  description: '',
  ctaText: 'Explore Collection',
  ctaLink: '/shop',
  imageUrl: '',
  displayOrder: 0,
  active: true,
};

const EMPTY_SHOWCASE_FORM: ShowcaseImageRequest = {
  title: '',
  imageUrl: '',
  linkUrl: '/shop',
  displayOrder: 0,
  active: true,
};

export function HeroBannersAdminView() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [formData, setFormData] = useState<HeroBannerRequest>(EMPTY_BANNER_FORM);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['admin-hero-banners'],
    queryFn: fetchAdminBanners,
  });

  const banners = normalizeList<HeroBanner>(data);

  const saveMutation = useMutation({
    mutationFn: (payload: HeroBannerRequest) =>
      editingBanner ? updateAdminBanner(editingBanner.id, payload) : createAdminBanner(payload),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-banners'] });
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      setFeedback(editingBanner ? `Banner "${saved.title}" updated successfully.` : `Banner "${saved.title}" created successfully.`);
      setError(null);
      resetForm();
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to save hero banner.');
      setFeedback(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      toggleAdminBannerStatus(id, active),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-banners'] });
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      setFeedback(`Banner "${updated.title}" ${updated.active ? 'activated' : 'paused'}.`);
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to change banner status.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAdminBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-banners'] });
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      setFeedback('Hero banner removed successfully.');
      setError(null);
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to delete banner.');
    },
  });

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      ...EMPTY_BANNER_FORM,
      displayOrder: banners.length + 1,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startEdit = (banner: HeroBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      ctaText: banner.ctaText || 'Explore Collection',
      ctaLink: banner.ctaLink || '/shop',
      imageUrl: banner.imageUrl,
      displayOrder: banner.displayOrder,
      active: banner.active,
    });
    setError(null);
    setFeedback(null);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      if (url) {
        setFormData((prev) => ({ ...prev, imageUrl: url }));
        setFeedback('Banner image uploaded successfully.');
        setTimeout(() => setFeedback(null), 3000);
      } else {
        throw new Error('Image URL not returned by server.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Banner title is required.');
      return;
    }
    if (!formData.imageUrl.trim()) {
      setError('Banner image is required. Upload a file or paste a valid URL.');
      return;
    }

    saveMutation.mutate(formData);
  };

  // --------------------------------------------------------------------------
  // RUNNING ARCHED SHOWCASE GALLERY (Marquee Strip) STATE & HANDLERS
  // --------------------------------------------------------------------------
  const showcaseFileInputRef = useRef<HTMLInputElement>(null);
  const [editingShowcase, setEditingShowcase] = useState<ShowcaseImage | null>(null);
  const [showcaseFormData, setShowcaseFormData] = useState<ShowcaseImageRequest>(EMPTY_SHOWCASE_FORM);
  const [uploadingShowcaseImage, setUploadingShowcaseImage] = useState(false);
  const [showcaseFeedback, setShowcaseFeedback] = useState<string | null>(null);
  const [showcaseError, setShowcaseError] = useState<string | null>(null);

  const { data: showcaseData, isLoading: isShowcaseLoading } = useQuery({
    queryKey: ['admin-showcase-images'],
    queryFn: fetchAdminShowcaseImages,
  });

  const showcaseImages = normalizeList<ShowcaseImage>(showcaseData);

  const saveShowcaseMutation = useMutation({
    mutationFn: (payload: ShowcaseImageRequest) =>
      editingShowcase
        ? updateAdminShowcaseImage(editingShowcase.id, payload)
        : createAdminShowcaseImage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-showcase-images'] });
      queryClient.invalidateQueries({ queryKey: ['showcase-images'] });
      setShowcaseFeedback(
        editingShowcase
          ? `Showcase image updated successfully.`
          : `Showcase image added successfully.`
      );
      setShowcaseError(null);
      resetShowcaseForm();
      setTimeout(() => setShowcaseFeedback(null), 4000);
    },
    onError: (err: unknown) => {
      setShowcaseError(err instanceof Error ? err.message : 'Failed to save showcase image.');
      setShowcaseFeedback(null);
    },
  });

  const toggleShowcaseMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      toggleAdminShowcaseStatus(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-showcase-images'] });
      queryClient.invalidateQueries({ queryKey: ['showcase-images'] });
      setShowcaseFeedback('Showcase image status updated.');
      setTimeout(() => setShowcaseFeedback(null), 3000);
    },
    onError: (err: unknown) => {
      setShowcaseError(err instanceof Error ? err.message : 'Failed to update status.');
    },
  });

  const deleteShowcaseMutation = useMutation({
    mutationFn: (id: number) => deleteAdminShowcaseImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-showcase-images'] });
      queryClient.invalidateQueries({ queryKey: ['showcase-images'] });
      setShowcaseFeedback('Showcase image removed successfully.');
      setTimeout(() => setShowcaseFeedback(null), 3000);
    },
    onError: (err: unknown) => {
      setShowcaseError(err instanceof Error ? err.message : 'Failed to delete showcase image.');
    },
  });

  const reorderShowcaseMutation = useMutation({
    mutationFn: (orderedIds: number[]) => reorderAdminShowcaseImages(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-showcase-images'] });
      queryClient.invalidateQueries({ queryKey: ['showcase-images'] });
      setShowcaseFeedback('Showcase images reordered.');
      setTimeout(() => setShowcaseFeedback(null), 2500);
    },
  });

  const resetShowcaseForm = () => {
    setEditingShowcase(null);
    setShowcaseFormData(EMPTY_SHOWCASE_FORM);
    if (showcaseFileInputRef.current) {
      showcaseFileInputRef.current.value = '';
    }
  };

  const startEditShowcase = (item: ShowcaseImage) => {
    setEditingShowcase(item);
    setShowcaseFormData({
      title: item.title || '',
      imageUrl: item.imageUrl,
      linkUrl: item.linkUrl || '/shop',
      displayOrder: item.displayOrder,
      active: item.active,
    });
    const formElement = document.getElementById('admin-showcase-form-card');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const handleShowcaseImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingShowcaseImage(true);
    setShowcaseError(null);
    try {
      const url = await uploadImage(file);
      if (url) {
        setShowcaseFormData((prev) => ({ ...prev, imageUrl: url }));
        setShowcaseFeedback('Showcase photo uploaded successfully.');
        setTimeout(() => setShowcaseFeedback(null), 3000);
      } else {
        throw new Error('Image URL not returned by server.');
      }
    } catch (err: unknown) {
      setShowcaseError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingShowcaseImage(false);
    }
  };

  const handleShowcaseSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!showcaseFormData.imageUrl.trim()) {
      setShowcaseError('Showcase image is required. Upload a file or paste an image URL.');
      return;
    }
    saveShowcaseMutation.mutate(showcaseFormData);
  };

  const handleMoveShowcase = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= showcaseImages.length) return;
    const copy = [...showcaseImages];
    const [selected] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, selected);
    reorderShowcaseMutation.mutate(copy.map((s) => s.id));
  };

  return (
    <div className="admin-banners-view" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Introduction banner */}
      <div className="admin-relationship-intro">
        <div className="eyebrow">Storefront Curation</div>
        <h2>Hero Banner Carousel</h2>
        <p>
          Manage the rotating showcase banners on the MALKAZ storefront. Curate luxury visuals, promotional taglines, and direct call-to-action buttons.
        </p>
      </div>

      {feedback && (
        <div className="admin-feedback" style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '12px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={18} />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="admin-feedback" style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', padding: '12px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Slide Editor Form */}
      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <div className="eyebrow">{editingBanner ? 'Update Slide' : 'New Slide'}</div>
            <h2>{editingBanner ? `Edit "${editingBanner.title}"` : 'Add Storefront Hero Banner'}</h2>
          </div>
          {editingBanner && (
            <button type="button" className="button secondary small" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="admin-form" style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <label className="form-field">
              <span>Main Title *</span>
              <input
                className="input"
                type="text"
                required
                maxLength={255}
                placeholder="e.g. Elegance in Every Detail"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </label>

            <label className="form-field">
              <span>Subtitle / Tagline (Optional)</span>
              <input
                className="input"
                type="text"
                maxLength={255}
                placeholder="e.g. FINE JEWELLERY COLLECTION"
                value={formData.subtitle || ''}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </label>
          </div>

          <label className="form-field" style={{ marginTop: '1rem' }}>
            <span>Description / Supporting Copy</span>
            <textarea
              className="input"
              rows={2}
              maxLength={500}
              placeholder="e.g. Discover handcrafted fine jewellery designed to illuminate every celebration with enduring radiance."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <label className="form-field">
              <span>Button Text</span>
              <input
                className="input"
                type="text"
                maxLength={100}
                placeholder="e.g. Explore Collection"
                value={formData.ctaText || ''}
                onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
              />
            </label>

            <label className="form-field">
              <span>Button Link</span>
              <input
                className="input"
                type="text"
                maxLength={255}
                placeholder="e.g. /shop or /categories"
                value={formData.ctaLink || ''}
                onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
              />
            </label>

            <label className="form-field">
              <span>Display Order</span>
              <input
                className="input"
                type="number"
                min={0}
                step={1}
                value={formData.displayOrder ?? 0}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })}
              />
            </label>
          </div>

          {/* Image Upload & URL Section */}
          <div style={{ marginTop: '1.25rem', padding: '16px', background: 'rgba(232, 222, 200, 0.2)', borderRadius: 12, border: '1px solid #E8DEC8' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#0A3B2C', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ImageIcon size={16} />
              <span>Banner Visual Asset *</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', alignItems: 'center' }}>
              <div>
                <label className="form-field">
                  <span>Image URL (or upload from PC)</span>
                  <input
                    className="input"
                    type="text"
                    required
                    placeholder="https://... or /hero-jewellery.jpg"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </label>
                <div style={{ marginTop: 8 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    className="button secondary small"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} />
                    {uploadingImage ? 'Uploading…' : 'Upload Image File'}
                  </button>
                  <small style={{ display: 'block', color: '#666', marginTop: 4 }}>
                    Recommended size: 1600×800 or 1920×960 landscape JPEG/PNG/WebP.
                  </small>
                </div>
              </div>

              {formData.imageUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, color: '#888' }}>Live Preview</span>
                  <div style={{ width: '100%', maxWidth: 280, height: 130, borderRadius: 8, overflow: 'hidden', border: '1px solid #E8DEC8', background: '#000' }}>
                    <img
                      src={resolveImageUrl(formData.imageUrl)}
                      alt="Banner Preview"
                      onError={handleImageError}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              <span>Active (Visible on Storefront)</span>
            </label>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <button
                type="submit"
                className="button"
                disabled={saveMutation.isPending || uploadingImage}
              >
                {saveMutation.isPending ? 'Saving…' : editingBanner ? 'Save Changes' : 'Create Banner Slide'}
              </button>
              {editingBanner && (
                <button type="button" className="button secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </section>

      {/* Banner Catalogue List */}
      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <div className="eyebrow">Storefront Rotation</div>
            <h2>Configured Hero Slides ({banners.length})</h2>
          </div>
        </div>

        {isLoading ? (
          <div className="skeleton line" style={{ height: 100, margin: '20px 0' }} />
        ) : isError ? (
          <div className="error-state" role="alert">
            <p>{queryError instanceof Error ? queryError.message : 'Failed to load hero banners.'}</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="admin-empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Layers size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p>No hero banners configured yet. Add your first banner slide above.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Order</th>
                  <th style={{ width: 140 }}>Preview</th>
                  <th>Title &amp; Subtitle</th>
                  <th>CTA Button</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner) => (
                  <tr key={banner.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0A3B2C', fontSize: 15 }}>
                        #{banner.displayOrder}
                      </span>
                    </td>
                    <td>
                      <div style={{ width: 120, height: 60, borderRadius: 6, overflow: 'hidden', border: '1px solid #E8DEC8', background: '#000' }}>
                        <img
                          src={resolveImageUrl(banner.imageUrl)}
                          alt={banner.title}
                          onError={handleImageError}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {banner.subtitle && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#7A4B58', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {banner.subtitle}
                          </span>
                        )}
                        <strong style={{ fontSize: 14, color: '#123A30' }}>{banner.title}</strong>
                        {banner.description && (
                          <small style={{ color: '#666', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {banner.description}
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{banner.ctaText || 'Explore Collection'}</span>
                        <small style={{ color: '#888' }}>({banner.ctaLink || '/shop'})</small>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-status ${banner.active ? 'is-active' : 'is-inactive'}`}>
                        {banner.active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="admin-actions" style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="button secondary small"
                        style={{ padding: '4px 8px', fontSize: 12 }}
                        title={banner.active ? 'Pause slide' : 'Activate slide'}
                        onClick={() => toggleMutation.mutate({ id: banner.id, active: !banner.active })}
                      >
                        {banner.active ? <EyeOff size={14} /> : <Eye size={14} />}
                        <span style={{ marginLeft: 4 }}>{banner.active ? 'Pause' : 'Activate'}</span>
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        title="Edit banner"
                        aria-label={`Edit ${banner.title}`}
                        onClick={() => startEdit(banner)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-button admin-delete"
                        title="Delete banner"
                        aria-label={`Delete ${banner.title}`}
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Delete banner "${banner.title}"?`)) {
                            deleteMutation.mutate(banner.id);
                          }
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ======================================================================
          SECTION 2: RUNNING ARCHED SHOWCASE GALLERY (MARQUEE STRIP)
          ====================================================================== */}
      <div style={{ margin: '48px 0 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1, height: 1, background: '#E8DEC8' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#C5A059', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <Sparkles size={16} />
          <span>Marquee Showcase Management</span>
          <Sparkles size={16} />
        </div>
        <div style={{ flex: 1, height: 1, background: '#E8DEC8' }} />
      </div>

      <section className="admin-panel" aria-label="Running Arched Showcase Gallery">
        <div className="admin-panel-head">
          <div>
            <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} style={{ color: '#C5A059' }} />
              <span>Homepage Arched Gallery</span>
            </div>
            <h2>Running Arched Showcase Images</h2>
            <p style={{ marginTop: 4, color: '#555', fontSize: 13.5 }}>
              Manage the horizontal scrolling arched jewellery cards showcased on the homepage under <em>"Jewellery that moves with your story"</em>.
            </p>
          </div>
        </div>

        {/* Live Marquee Preview Strip */}
        <div style={{ margin: '20px 0 28px', background: '#062818', borderRadius: 14, padding: '24px 20px', border: '1px solid rgba(212, 175, 99, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ color: '#D4AF37', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ✦ Live Storefront Marquee Strip Preview ({showcaseImages.filter((s) => s.active).length} Active Items)
            </span>
            <small style={{ color: '#FAF8F3', opacity: 0.75, fontSize: 11.5 }}>
              Curved arched frames exactly as seen by customers
            </small>
          </div>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
            {(showcaseImages.length > 0 ? showcaseImages : [
              { id: 1, title: 'Royal Emerald Necklace', imageUrl: '/products/jewels/royal-emerald-necklace.jpg', active: true, displayOrder: 1 },
              { id: 2, title: 'Traditional Kundan Jhumka', imageUrl: '/products/jewels/traditional-kundan-jhumka.jpg', active: true, displayOrder: 2 },
              { id: 3, title: 'Vintage Emerald Ring', imageUrl: '/products/jewels/vintage-emerald-ring.jpg', active: true, displayOrder: 3 },
            ]).map((item, idx) => (
              <div
                key={item.id}
                style={{
                  flex: '0 0 auto',
                  width: 110,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  opacity: item.active !== false ? 1 : 0.4,
                }}
              >
                <div
                  style={{
                    width: 100,
                    height: 135,
                    borderRadius: '50px 50px 12px 12px',
                    overflow: 'hidden',
                    border: '1.5px solid rgba(212, 175, 99, 0.75)',
                    background: '#F7F1E7',
                    boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
                  }}
                >
                  <img
                    src={resolveImageUrl(item.imageUrl)}
                    alt={item.title || ''}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={handleImageError}
                  />
                </div>
                <span
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    color: '#FAF8F3',
                    textAlign: 'center',
                    maxWidth: 100,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.title || `Item #${idx + 1}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Showcase Form */}
        <div id="admin-showcase-form-card" className="admin-form-card" style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: '#0A3B2C', display: 'flex', alignItems: 'center', gap: 8 }}>
              {editingShowcase ? <Pencil size={16} /> : <Plus size={16} />}
              <span>{editingShowcase ? `Edit Arched Showcase Photo #${editingShowcase.id}` : 'Add New Arched Showcase Photo'}</span>
            </h3>
            {editingShowcase && (
              <button type="button" className="button secondary small" onClick={resetShowcaseForm}>
                Cancel Edit
              </button>
            )}
          </div>

          {showcaseFeedback && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#E6F4EA', border: '1px solid #34A853', borderRadius: 8, color: '#137333', marginBottom: 16, fontSize: 13 }}>
              <CheckCircle2 size={16} />
              <span>{showcaseFeedback}</span>
            </div>
          )}

          {showcaseError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FCE8E6', border: '1px solid #D93025', borderRadius: 8, color: '#C5221F', marginBottom: 16, fontSize: 13 }}>
              <AlertCircle size={16} />
              <span>{showcaseError}</span>
            </div>
          )}

          <form onSubmit={handleShowcaseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <label className="form-field">
                <span>Title / Piece Name (Optional)</span>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Royal Emerald Choker"
                  value={showcaseFormData.title || ''}
                  onChange={(e) => setShowcaseFormData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </label>

              <label className="form-field">
                <span>Target Store Link</span>
                <input
                  type="text"
                  className="input"
                  placeholder="/shop or /categories"
                  value={showcaseFormData.linkUrl || '/shop'}
                  onChange={(e) => setShowcaseFormData((prev) => ({ ...prev, linkUrl: e.target.value }))}
                />
              </label>
            </div>

            {/* Image Upload / URL Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'flex-end' }}>
              <label className="form-field" style={{ margin: 0 }}>
                <span>Showcase Image URL *</span>
                <input
                  type="text"
                  className="input"
                  placeholder="https://... or /products/jewels/..."
                  value={showcaseFormData.imageUrl}
                  onChange={(e) => setShowcaseFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  required
                />
              </label>

              <div>
                <input
                  type="file"
                  ref={showcaseFileInputRef}
                  style={{ display: 'none' }}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleShowcaseImageUpload}
                />
                <button
                  type="button"
                  className="button secondary"
                  style={{ height: 42, display: 'flex', alignItems: 'center', gap: 6 }}
                  disabled={uploadingShowcaseImage}
                  onClick={() => showcaseFileInputRef.current?.click()}
                >
                  <Upload size={15} />
                  <span>{uploadingShowcaseImage ? 'Uploading…' : 'Upload Image'}</span>
                </button>
              </div>
            </div>

            {/* Arched Live Preview Box */}
            {showcaseFormData.imageUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 14, background: '#FAF8F3', border: '1px solid #E8DEC8', borderRadius: 10 }}>
                <div
                  style={{
                    width: 72,
                    height: 98,
                    borderRadius: '36px 36px 8px 8px',
                    overflow: 'hidden',
                    border: '1.5px solid #D4AF37',
                    background: '#062818',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={resolveImageUrl(showcaseFormData.imageUrl)}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={handleImageError}
                  />
                </div>
                <div>
                  <strong style={{ fontSize: 13, color: '#0A3B2C' }}>Arched Shape Preview</strong>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#666' }}>
                    {showcaseFormData.title || 'Untitled jewellery piece'} · Links to {showcaseFormData.linkUrl || '/shop'}
                  </p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5 }}>
                <input
                  type="checkbox"
                  checked={showcaseFormData.active !== false}
                  onChange={(e) => setShowcaseFormData((prev) => ({ ...prev, active: e.target.checked }))}
                />
                <span>Active on Homepage Marquee</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="submit"
                className="button"
                disabled={saveShowcaseMutation.isPending || uploadingShowcaseImage}
              >
                {saveShowcaseMutation.isPending
                  ? 'Saving…'
                  : editingShowcase
                    ? 'Save Changes'
                    : 'Add to Showcase Marquee'}
              </button>
              {editingShowcase && (
                <button type="button" className="button secondary" onClick={resetShowcaseForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Existing Showcase Items List */}
        {isShowcaseLoading ? (
          <div className="skeleton line" style={{ height: 120 }} />
        ) : showcaseImages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', background: '#FAF8F3', borderRadius: 12, border: '1px dashed #D4AF37' }}>
            <ImageIcon size={32} style={{ color: '#D4AF37', margin: '0 auto 10px', opacity: 0.8 }} />
            <h4 style={{ margin: '0 0 6px', color: '#0A3B2C' }}>No showcase photos added yet</h4>
            <p style={{ color: '#666', fontSize: 13, margin: 0 }}>
              Use the form above to add your first arched jewellery image to the marquee.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Order</th>
                  <th style={{ width: 100 }}>Arched Photo</th>
                  <th>Piece Details</th>
                  <th>Link</th>
                  <th style={{ width: 90 }}>Status</th>
                  <th style={{ width: 220, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {showcaseImages.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontWeight: 700, color: '#0A3B2C', fontSize: 14 }}>
                          #{item.displayOrder || index + 1}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginLeft: 4 }}>
                          <button
                            type="button"
                            className="icon-button"
                            style={{ width: 22, height: 22, padding: 0 }}
                            title="Move earlier in strip"
                            disabled={index === 0 || reorderShowcaseMutation.isPending}
                            onClick={() => handleMoveShowcase(index, 'left')}
                          >
                            <ArrowLeft size={12} />
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            style={{ width: 22, height: 22, padding: 0 }}
                            title="Move later in strip"
                            disabled={index === showcaseImages.length - 1 || reorderShowcaseMutation.isPending}
                            onClick={() => handleMoveShowcase(index, 'right')}
                          >
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          width: 58,
                          height: 78,
                          borderRadius: '29px 29px 7px 7px',
                          overflow: 'hidden',
                          border: '1.5px solid rgba(212, 175, 99, 0.8)',
                          background: '#062818',
                        }}
                      >
                        <img
                          src={resolveImageUrl(item.imageUrl)}
                          alt={item.title || ''}
                          onError={handleImageError}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ fontSize: 14, color: '#123A30' }}>
                          {item.title || 'Untitled jewellery piece'}
                        </strong>
                        <small style={{ color: '#888', marginTop: 2 }}>
                          {item.imageUrl}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12.5, color: '#0A3B2C', fontWeight: 500 }}>
                        {item.linkUrl || '/shop'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-status ${item.active ? 'is-active' : 'is-inactive'}`}>
                        {item.active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="admin-actions" style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="button secondary small"
                        style={{ padding: '4px 8px', fontSize: 12 }}
                        title={item.active ? 'Pause in marquee' : 'Activate in marquee'}
                        onClick={() => toggleShowcaseMutation.mutate({ id: item.id, active: !item.active })}
                      >
                        {item.active ? <EyeOff size={14} /> : <Eye size={14} />}
                        <span style={{ marginLeft: 4 }}>{item.active ? 'Pause' : 'Activate'}</span>
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        title="Edit showcase image"
                        aria-label={`Edit ${item.title || 'photo'}`}
                        onClick={() => startEditShowcase(item)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-button admin-delete"
                        title="Delete showcase image"
                        aria-label={`Delete ${item.title || 'photo'}`}
                        disabled={deleteShowcaseMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Delete showcase image "${item.title || 'Untitled'}"?`)) {
                            deleteShowcaseMutation.mutate(item.id);
                          }
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
