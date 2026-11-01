import { useState } from "react";
import toast from "react-hot-toast";
import { sendContact } from "../services/api";
import Reveal from "../components/Reveal";

const initial = {
  name: "",
  email: "",
  message: "",
};

export default function Contact() {
  const [form, setForm] = useState(initial);
  const [sending, setSending] = useState(false);

  function change(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function submit(e) {
    e.preventDefault();
    setSending(true);

    try {
      await sendContact(form);

      setForm(initial);
      toast.success("Thanks! Your message has been sent.");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Message could not be sent. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="page-wrap contact-wrap">
      <p className="eyebrow">Get in touch</p>
      <h1 className="page-title">Help us make campus easier to explore.</h1>

      <p className="page-lead">
        Have an idea or spotted a campus detail that needs updating? Send us a
        message.
      </p>

      <Reveal
        as="form"
        onSubmit={submit}
        className="form-card"
      >
        {/* Name */}
        <label className="form-label">
          Name
          <input
            required
            name="name"
            value={form.name}
            onChange={change}
            className="form-input"
          />
        </label>

        {/* Email */}
        <label className="form-label">
          Email
          <input
            required
            type="email"
            name="email"
            value={form.email}
            onChange={change}
            className="form-input"
          />
        </label>

        {/* Message */}
        <label className="form-label">
          Message
          <textarea
            required
            minLength={5}
            name="message"
            value={form.message}
            onChange={change}
            rows={5}
            className="form-input"
          />
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={sending}
          className="primary-button mt-5 px-5 py-3"
        >
          {sending ? "Sending..." : "Send message"}
        </button>
      </Reveal>
    </section>
  );
}
