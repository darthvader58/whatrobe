import { useState } from 'react';
import { Send, MessageSquare, Star } from 'lucide-react';

const Feedback = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    category: 'general',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://whatrobe-api.rajayshashwat.workers.dev/api/feedback'
        : 'http://localhost:8788/api/feedback';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFormData({
          name: '',
          email: '',
          rating: 5,
          category: 'general',
          message: ''
        });
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>
            <MessageSquare size={48} />
          </div>
          <h2 style={styles.successTitle}>Thank You!</h2>
          <p style={styles.successMessage}>
            Your feedback has been submitted successfully. We appreciate your input and will use it to improve Whatrobe.
          </p>
          <button 
            style={styles.backButton}
            className="back-button"
            onClick={() => setIsSubmitted(false)}
          >
            Submit Another Feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="feedback-container">
      <div style={styles.header}>
        <h1 style={styles.title}>We'd Love Your Feedback</h1>
        <p style={styles.subtitle}>
          Help us improve Whatrobe by sharing your thoughts and suggestions
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form} className="feedback-form">
        <div style={styles.formGrid} className="feedback-form-grid">
          {/* Name Field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Your name"
              required
            />
          </div>

          {/* Email Field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="your.email@example.com"
              required
            />
          </div>
        </div>

        {/* Rating */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Overall Rating</label>
          <div style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingChange(star)}
                className="star-button"
                style={{
                  ...styles.starButton,
                  color: star <= formData.rating ? '#fbbf24' : '#64748b'
                }}
              >
                <Star size={24} fill={star <= formData.rating ? '#fbbf24' : 'none'} />
              </button>
            ))}
            <span style={styles.ratingText}>
              {formData.rating} out of 5 stars
            </span>
          </div>
        </div>

        {/* Category */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            style={styles.select}
            required
          >
            <option value="general">General Feedback</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="ui">User Interface</option>
            <option value="performance">Performance</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Message */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Your Feedback</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            style={styles.textarea}
            placeholder="Tell us what you think about Whatrobe. What features do you love? What could be improved?"
            rows={6}
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="submit-button"
          style={{
            ...styles.submitButton,
            opacity: isSubmitting ? 0.7 : 1,
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitting ? (
            <>
              <div style={styles.spinner} />
              Submitting...
            </>
          ) : (
            <>
              <Send size={20} />
              Submit Feedback
            </>
          )}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'var(--text)',
    marginBottom: '12px',
    background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: '18px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
  },
  form: {
    background: 'var(--surface)',
    borderRadius: '20px',
    padding: '40px',
    border: '1px solid var(--surface-light)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '24px',
  },
  formGroup: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text)',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid var(--surface-light)',
    background: 'var(--background)',
    color: 'var(--text)',
    fontSize: '16px',
    transition: 'border-color 0.3s ease',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid var(--surface-light)',
    background: 'var(--background)',
    color: 'var(--text)',
    fontSize: '16px',
    transition: 'border-color 0.3s ease',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid var(--surface-light)',
    background: 'var(--background)',
    color: 'var(--text)',
    fontSize: '16px',
    resize: 'vertical',
    minHeight: '120px',
    fontFamily: 'inherit',
    transition: 'border-color 0.3s ease',
  },
  ratingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  starButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    transition: 'transform 0.2s ease',
  },
  ratingText: {
    marginLeft: '12px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  submitButton: {
    width: '100%',
    padding: '16px 24px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  successCard: {
    background: 'var(--surface)',
    borderRadius: '20px',
    padding: '60px 40px',
    textAlign: 'center',
    border: '1px solid var(--surface-light)',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    margin: '0 auto 24px',
  },
  successTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: 'var(--text)',
    marginBottom: '16px',
  },
  successMessage: {
    fontSize: '16px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    marginBottom: '32px',
  },
  backButton: {
    padding: '12px 24px',
    borderRadius: '12px',
    border: '2px solid var(--surface-light)',
    background: 'var(--surface-light)',
    color: 'var(--text)',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};

export default Feedback;