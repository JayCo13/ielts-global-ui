import React from 'react';
import PolicyLayout, { Section, Bullets } from '../../components/PolicyLayout';

const AboutUs = () => (
  <PolicyLayout
    title="Introduction"
    seoTitle="About Us | EnglishOnComputer"
    seoDescription="EnglishOnComputer is an English learning website that uses AI-powered tools and technology to create useful, engaging, and personalized English lessons."
    path="/about"
  >
    <div className="flex justify-center mb-8">
      <img src="/img/logo-eoc.png" alt="EnglishOnComputer logo" className="h-40 w-auto" />
    </div>

    <Section title="Who We Are">
      <p>
        <strong>EnglishOnComputer</strong> is an English learning website that uses <strong>AI-powered tools and technology</strong> to
        create useful, engaging, and personalized English lessons. Our goal is to provide learners with a modern alternative to
        traditional teacher-based learning, allowing them to study English anytime and anywhere.
      </p>
      <p>
        We develop a range of <strong>AI-supported learning tools</strong> designed to help students improve their English skills more
        effectively. From practicing vocabulary and grammar to developing listening, speaking, reading, and writing skills, our
        platform provides interactive learning experiences that adapt to learners' needs and support their continuous progress.
      </p>
      <p>
        By combining <strong>artificial intelligence, educational content, and innovative learning methods</strong>, we aim to make
        English learning more accessible, flexible, and effective. Our tools help students practice independently, identify areas
        for improvement, and build their confidence step by step.
      </p>
      <blockquote className="border-l-4 border-[#0096b1] bg-[#0096b1]/5 rounded-r-lg px-5 py-4">
        <p className="italic text-gray-800">"Learn smarter with AI, improve your English, and take your skills to the next level."</p>
        <p className="mt-2 font-semibold text-[#2b5356]">— EnglishOnComputer Team</p>
      </blockquote>
    </Section>

    <Section title="Our Team">
      <p>
        <strong>EnglishOnComputer</strong> brings together people who are passionate about <strong>English education, technology, and
        artificial intelligence</strong>. We continuously develop and improve our learning tools to provide students with useful and
        effective ways to improve their English.
      </p>
      <p>Our team includes:</p>
      <Bullets
        items={[
          <><strong>English educators</strong> who understand students' learning needs</>,
          <><strong>AI and technology specialists</strong> who develop smart learning tools</>,
          <><strong>Content developers</strong> who create practical and engaging English lessons</>,
          <><strong>Learning support specialists</strong> who help improve the overall learning experience</>,
        ]}
      />
    </Section>
  </PolicyLayout>
);

export default AboutUs;
