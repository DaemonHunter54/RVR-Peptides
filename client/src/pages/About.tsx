import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ASSETS, ASSET_FALLBACKS } from "@/lib/assets";
import { Shield, FlaskConical, Award, Truck } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 py-16 lg:py-24">
        <div className="container text-center">
          <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4">About River Valley Research Peptides</h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-lg">
            Dedicated to providing the highest quality research peptides with unmatched purity and transparency.
          </p>
        </div>
      </div>

      {/* Mission */}
      <section className="py-16 lg:py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">Our Mission</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                River Valley Research Peptides is committed to advancing scientific research by providing premium-grade
                peptides and research compounds. Every product in our catalog undergoes rigorous third-party testing
                to ensure the highest standards of purity and quality.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                We believe that researchers deserve access to the best tools available. That's why we maintain
                strict quality control protocols and provide detailed certificates of analysis for every batch.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Our team is passionate about supporting the scientific community with reliable, consistent,
                and thoroughly documented research materials.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/10 rounded-3xl blur-2xl" />
                <img src={ASSETS.peptideVial} alt="Research Peptide" className="relative w-72 h-72 object-contain" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ASSET_FALLBACKS.peptideVial; }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="container">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 text-center mb-12">Why Choose Us</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: "99%+ Purity", desc: "Every product is third-party tested and verified to meet or exceed 99% purity standards." },
              { icon: FlaskConical, title: "Research Backed", desc: "Each product page includes detailed research citations and scientific sources for transparency." },
              { icon: Award, title: "Premium Quality", desc: "We source only the highest quality compounds from trusted, certified manufacturers." },
              { icon: Truck, title: "Fast Shipping", desc: "Orders are processed same-day and shipped with care to ensure product integrity." },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 text-center">
                <div className="inline-flex p-3 rounded-xl bg-blue-50 text-blue-600 mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 bg-slate-900">
        <div className="container text-center">
          <p className="text-sm text-slate-400 max-w-3xl mx-auto leading-relaxed">
            All products sold by River Valley Research Peptides are intended strictly for research, laboratory,
            or analytical purposes only. They are not intended for human consumption, veterinary use, or any
            therapeutic applications. By purchasing our products, you agree to use them solely for legitimate
            research purposes in compliance with all applicable laws and regulations.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
