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
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">Contact us</h1>

      <p className="mt-2 text-slate-600">
        Have an idea or spotted a campus detail that needs updating? Send us a
        message.
      </p>

      <form
        onSubmit={submit}
        className="mt-7 rounded-2xl bg-white p-6 shadow-sm"
      >
        {/* Name */}
        <label className="block text-sm font-medium">
          Name
          <input
            required
            name="name"
            value={form.name}
            onChange={change}
            className="mt-1 w-full rounded-lg border p-3"
          />
        </label>

        {/* Email */}
        <label className="mt-5 block text-sm font-medium">
          Email
          <input
            required
            type="email"
            name="email"
            value={form.email}
            onChange={change}
            className="mt-1 w-full rounded-lg border p-3"
          />
        </label>

        {/* Message */}
        <label className="mt-5 block text-sm font-medium">
          Message
          <textarea
            required
            minLength={5}
            name="message"
            value={form.message}
            onChange={change}
            rows={5}
            className="mt-1 w-full rounded-lg border p-3"
          />
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={sending}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send message"}
        </button>
      </form>
    </section>
  );
}