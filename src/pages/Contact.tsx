import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Phone, 
  MapPin, 
  Mail, 
  Facebook, 
  Linkedin, 
  Instagram, 
  // Youtube, // Removed unused import
  Send,
  CheckCircle,
  AlertCircle
} from "lucide-react";

import { saveContactMessage } from "@/integrations/supabase/services/contactService";
import { sendEmailsViaNetlify } from "@/integrations/email/netlifyEmailService";
import { useToast } from "@/hooks/use-toast";

import { useCompanyInfo, useContactInfo, useSocialLinks } from "@/hooks/useLocalizedConstants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const Contact = () => {
  const { t } = useLanguage();
  const companyInfo = useCompanyInfo();
  const contactInfo = useContactInfo();
  const socialLinks = useSocialLinks();
  const { toast } = useToast();
  
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Ensure map iframe loads properly
  useEffect(() => {
    // Force the map to load by directly setting the src attribute from data-src
    const mapIframe = document.querySelector('iframe[data-loading="lazy"]') as HTMLIFrameElement;
    if (mapIframe && mapIframe.src === 'about:blank' && mapIframe.dataset.src) {
      mapIframe.src = mapIframe.dataset.src;
    }
    
    // Import and setup iframe lazy loading directly in the component
    import('@/utils/iframeLazyLoad').then(module => {
      const { setupIframeLazyLoading } = module;
      setupIframeLazyLoading();
    }).catch(error => {
      console.error('Failed to load iframe lazy loading utility:', error);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // First save message to Supabase database
      const { success: dbSuccess, error: dbError } = await saveContactMessage(formState);
      
      if (!dbSuccess) {
        throw new Error(dbError || t('Failed to save your message'));
      }
      
      // Send emails via Netlify function (confirmation to user and notification to company)
      try {
        const { success: emailSuccess, userEmailSent, companyEmailSent, error: emailError } = await sendEmailsViaNetlify({
          ...formState,
          formType: 'contact'
        });
        
        if (!emailSuccess) {
          console.warn('Email sending failed:', emailError || 'Unknown error');
          // Show toast notification about email issues but don't treat it as a complete failure
          toast({
            title: t('Message Saved'),
            description: t('Your message has been saved, but there was an issue sending the email confirmation.'),
            variant: "default"
          });
          // Continue execution even if email fails - we've already saved to database
        } else if (userEmailSent && !companyEmailSent) {
          console.info('Only user confirmation email was sent successfully');
        } else if (!userEmailSent && companyEmailSent) {
          console.info('Only company notification email was sent successfully');
        }
      } catch (emailSendError) {
        console.error('Exception when sending email:', emailSendError);
        // Show toast notification about email issues but don't treat it as a complete failure
        toast({
          title: t('Message Saved'),
          description: t('Your message has been saved, but there was an issue sending the email confirmation.'),
          variant: "default"
        });
        // Continue execution even if email fails - we've already saved to database
      }
      
      // Show success toast notification
      toast({
        title: t('Message Sent'),
        description: t('Thank You Message')
        // Using default variant for success
      });
      
      setIsSubmitted(true);
      setFormState({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(error instanceof Error ? error.message : t('Something went wrong. Please try again.'));
      
      toast({
        title: t('Error'),
        description: error instanceof Error ? error.message : t('Something went wrong. Please try again.'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <>
      <Helmet>
        <title>{`${t('Contact Us')} | ${companyInfo.name}`}</title>
        <meta
          name="description"
          content={t("contact_meta_description")}
        />
      </Helmet>

      {/* Hero Section */}
      <div className="relative pt-24 pb-20 overflow-hidden bg-brand-blue text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-pattern-dots"></div>
        </div>

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="inline-block bg-brand-orange text-white px-3 py-1 rounded-md text-sm font-medium mb-4">
              {t("GET IN TOUCH")}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl uppercase mb-6">
              {t("Contact Us")}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl">
              {t("Contact Page Message")}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Contact Information and Form Section */}
      <section className="py-12 bg-white">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-10">
            {/* Contact Information */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.h2 
                className="text-3xl uppercase mb-8 text-brand-blue"
                variants={itemVariants}
              >
                {t('Contact Information')}
              </motion.h2>
              
              <div className="space-y-8">
                <motion.div variants={itemVariants}>
                  <Card className="border-none shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 flex items-start space-x-4">
                      <div className="bg-brand-orange p-3 rounded-full text-white">
                        <Phone size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{t('Phone')}</h3>
                        <p className="text-gray-600">{contactInfo.phone}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <Card className="border-none shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 flex items-start space-x-4">
                      <div className="bg-brand-orange p-3 rounded-full text-white">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{t('Address')}</h3>
                        <p className="text-gray-600">{contactInfo.address}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <Card className="border-none shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 flex items-start space-x-4">
                      <div className="bg-brand-orange p-3 rounded-full text-white">
                        <Mail size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{t('Email')}</h3>
                        <p className="text-gray-600">{t('Email Contact')}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
              
              <motion.div 
                className="mt-10"
                variants={itemVariants}
              >
                <h3 className="text-xl font-semibold mb-4">{t('Connect With Us')}</h3>
                <div className="flex space-x-4">
                  <a 
                    href={socialLinks.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-gray-100 p-3 rounded-full hover:bg-brand-orange hover:text-white transition-all duration-300"
                    aria-label="Visit our Facebook page"
                    title="Visit our Facebook page"
                  >
                    <Facebook size={20} />
                  </a>
                  <a 
                    href={socialLinks.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-gray-100 p-3 rounded-full hover:bg-brand-orange hover:text-white transition-all duration-300"
                    aria-label="Visit our LinkedIn page"
                    title="Visit our LinkedIn page"
                  >
                    <Linkedin size={20} />
                  </a>
                  <a 
                    href={socialLinks.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-gray-100 p-3 rounded-full hover:bg-brand-orange hover:text-white transition-all duration-300"
                    aria-label="Visit our Instagram profile"
                    title="Visit our Instagram profile"
                  >
                    <Instagram size={20} />
                  </a>
                  {/* <a 
                    href={socialLinks.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-gray-100 p-3 rounded-full hover:bg-brand-orange hover:text-white transition-all duration-300"
                    aria-label="Visit our YouTube channel"
                    title="Visit our YouTube channel"
                  >
                    <Youtube size={20} />
                  </a> */}
                </div>
              </motion.div>
            </motion.div>
            
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <h2 className="text-3xl uppercase mb-6 text-brand-blue">{t('Send Us a Message')}</h2>
              
              {isSubmitted ? (
                <motion.div 
                  className="flex flex-col items-center justify-center h-64 text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <CheckCircle className="text-green-500 mb-4" size={60} />
                  <h3 className="text-2xl font-bold text-green-500 mb-2">{t('Message Sent')}</h3>
                  <p className="text-gray-600">{t('Thank You Message')}</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('Your Name')}
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      placeholder={t('Your Name')}
                      required
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('Email Address')}
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formState.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      required
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('Subject')}
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formState.subject}
                      onChange={handleChange}
                      placeholder={t('Subject')}
                      required
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('Message')}
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formState.message}
                      onChange={handleChange}
                      placeholder={t('Message')}
                      required
                      className="w-full min-h-[150px]"
                    />
                  </div>
                  
                  {submitError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                      <AlertCircle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                      <p className="text-red-700 text-sm">{submitError}</p>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {t('Sending')}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Send size={18} className="mr-2" />
                        {t('Send Message')}
                      </div>
                    )}
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Map Section */}
      <section className="py-10 bg-gray-50">
        <div className="container px-4">
          <motion.h2 
            className="text-3xl uppercase mb-8 text-center text-brand-blue"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t('Find Us')}
          </motion.h2>
          
          <motion.div
            className="rounded-xl overflow-hidden shadow-lg h-[400px]"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <iframe 
              src="about:blank"
              data-src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2689.0738732237!2d-122.13915732376517!3d47.62756197118547!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54906c8e35fad2d3%3A0x7b4d1c9c5e7f0c7a!2s2018%20156th%20Ave%20NE%2C%20Bellevue%2C%20WA%2098007!5e0!3m2!1sen!2sus!4v1653508234567!5m2!1sen!2sus" 
              width="100%" 
              height="100%" 
              className="border-0" 
              allowFullScreen 
              data-loading="lazy" /* Using data-loading for compatibility with our custom lazy loading utility */
              referrerPolicy="no-referrer-when-downgrade"
              title="BOH Concepts Location"
            ></iframe>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Contact;