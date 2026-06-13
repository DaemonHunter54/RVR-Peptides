import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Package, Headphones } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BUSINESS } from "@shared/business";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const settingsQuery = trpc.settings.public.useQuery();
  const settings = settingsQuery.data || {};
  const supportEmail = settings.contact_email || BUSINESS.supportEmail;
  const customerServiceEmail = settings.customer_service_email || BUSINESS.customerServiceEmail;
  const ordersEmail = settings.orders_email || BUSINESS.ordersEmail;
  const legalName = settings.business_legal_name || BUSINESS.legalName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoUrl = `mailto:${customerServiceEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `Name: ${name}\nReply-to: ${email}\n\n${message}`
    )}`;
    window.location.href = mailtoUrl;
    toast.success("Opening your email app to send your message.");
  };

  const contactOptions = [
    {
      icon: Headphones,
      title: "Customer Service",
      email: customerServiceEmail,
      description: "General questions, product inquiries, and account help.",
    },
    {
      icon: Package,
      title: "Orders",
      email: ordersEmail,
      description: "Order status, cancellations before shipment, and shipping questions.",
    },
    {
      icon: Mail,
      title: "Support",
      email: supportEmail,
      description: "Technical website issues and policy questions.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 py-12 lg:py-16">
        <div className="container">
          <h1 className="text-3xl lg:text-4xl font-bold text-white">Contact Us</h1>
          <p className="text-slate-300 mt-2">Have a question? We&apos;d love to hear from you.</p>
        </div>
      </div>

      <div className="container py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Send a Message</h2>
            <p className="text-sm text-slate-500 mb-4">
              Submitting the form opens your email app addressed to{" "}
              <a href={`mailto:${customerServiceEmail}`} className="text-blue-600 hover:underline">
                {customerServiceEmail}
              </a>
              .
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5" placeholder="Your name" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} required className="mt-1.5" placeholder="How can we help?" />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} required className="mt-1.5" rows={6} placeholder="Your message..." />
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <MessageSquare className="h-4 w-4" /> Send Message
              </Button>
            </form>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Get in Touch</h2>
            <div className="space-y-4">
              {contactOptions.map((option) => (
                <div key={option.email} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-start gap-3">
                    <option.icon className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-800">{option.title}</p>
                      <a href={`mailto:${option.email}`} className="text-sm text-blue-600 hover:text-blue-700">
                        {option.email}
                      </a>
                      <p className="text-sm text-slate-500 leading-relaxed mt-2">{option.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <p className="text-sm text-slate-600 leading-relaxed">{legalName}</p>
                <p className="text-sm text-slate-500 leading-relaxed mt-2">
                  We typically respond to all inquiries within 24 hours on business days (Monday–Friday,
                  excluding U.S. holidays). For urgent matters, include &quot;URGENT&quot; in your subject line.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
