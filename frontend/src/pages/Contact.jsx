import { useState } from "react";
import toast from "react-hot-toast";
import { sendContact } from "../services/api";

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
    <section className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <p className="eyebrow">LET’S TALK</p>
      <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Contact us</h1>

      <p className="muted-text mt-3 leading-7">
        Have an idea or spotted a campus detail that needs updating? Send us a
        message.
      </p>

      <form
        onSubmit={submit}
        className="surface-card mt-7 p-5 sm:p-7"
      >
        {/* Name */}
        <label className="form-label block">
          Name
          <input
            required
            name="name"
            value={form.name}
            onChange={change}
            className="site-input mt-2 p-3"
          />
        </label>

        {/* Email */}
        <label className="form-label mt-5 block">
          Email
          <input
            required
            type="email"
            name="email"
            value={form.email}
            onChange={change}
            className="site-input mt-2 p-3"
          />
        </label>

        {/* Message */}
        <label className="form-label mt-5 block">
          Message
          <textarea
            required
            minLength={5}
            name="message"
            value={form.message}
            onChange={change}
            rows={5}
            className="site-input mt-2 p-3"
          />
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={sending}
          className="button-primary mt-5 min-h-11 px-5 py-2 disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send message"}
        </button>
      </form>
    </section>
  );
}
