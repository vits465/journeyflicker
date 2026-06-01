import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SEO } from '../components/SEO';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

const deletionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(100),
  email: z.string().email('Please enter a valid email address.'),
  facebookId: z.string().optional(),
  reason: z.string().min(1, 'Please select a reason.'),
  details: z.string().max(1000).optional(),
  confirm: z.boolean().refine(val => val === true, {
    message: 'You must confirm data deletion permanent effects.',
  }),
});

type DeletionFormValues = z.infer<typeof deletionSchema>;

export default function DataDeletionPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<DeletionFormValues>({
    resolver: zodResolver(deletionSchema),
    defaultValues: {
      reason: 'Account Retirement',
      confirm: false
    }
  });

  const onSubmit = async (data: DeletionFormValues) => {
    setSending(true);
    
    // Construct a comprehensive message for the contact database
    const messageContent = [
      `--- DATA DELETION REQUEST ---`,
      `Voyager Name: ${data.name}`,
      `Contact Email: ${data.email}`,
      `Facebook ID: ${data.facebookId || 'Not Provided / Manual Request'}`,
      `Deletion Reason: ${data.reason}`,
      `Client Narrative: ${data.details || 'None provided.'}`,
      `Permanent Deletion Confirmation: Verified and Consented`,
      `-----------------------------`
    ].join('\n');

    try {
      await api.createContact({
        name: data.name,
        email: data.email,
        type: 'Data Deletion Request',
        message: messageContent
      });

      // Generate a mock ticket ID for security tracking
      const generatedTicket = `JF-DL-${Math.floor(100000 + Math.random() * 900000)}`;
      setTicketId(generatedTicket);
      setSubmitted(true);
      reset();
      toast.success("Deletion protocol initiated successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Transmission failed. Please attempt direct contact via privacy@journeyflicker.com.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <SEO 
        title="User Data Deletion Protocol | JourneyFlicker" 
        description="JourneyFlicker User Data Deletion Instructions & Form. Fulfill Facebook/Meta App review requirements for permanent data purging."
        noindex={true}
      />

      {/* ── HERO ── */}
      <section className="relative h-[55vh] min-h-[360px] max-h-[560px] flex flex-col justify-end px-4 sm:px-8 md:px-16 overflow-hidden bg-black pb-10 sm:pb-14">
        <div className="absolute inset-0 z-0">
          <img 
            className="absolute inset-0 w-full h-full object-cover opacity-55 grayscale animate-image-pan"
            alt="Minimalist technology interface" 
            src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 w-full max-w-5xl mx-auto animate-reveal-up">
          <span className="text-white/60 text-[10px] tracking-[0.5em] uppercase mb-3 block font-bold">Security Bureau</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tighter text-white">
            Deletion<br/><span className="italic font-serif text-white/90">Protocol</span>
          </h1>
        </div>
      </section>

      {/* ── EXPLAINER & FORM SECTIONS ── */}
      <section className="py-14 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-surface-container-lowest dark:bg-black">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left: Meta Policy Explainer */}
          <div className="lg:col-span-5 space-y-8 animate-reveal-up">
            <div>
              <span className="text-primary text-[10px] font-bold tracking-[0.4em] uppercase mb-4 block">Facebook/Meta Compliance</span>
              <h2 className="text-2xl sm:text-3xl font-light tracking-tighter font-serif italic text-black dark:text-white leading-tight">
                Data Deletion Instructions
              </h2>
              <div className="h-px bg-outline-variant/30 dark:bg-white/10 w-24 my-5" />
            </div>

            <div className="space-y-5 text-sm font-light leading-relaxed text-on-surface-variant opacity-80">
              <p>
                In compliance with Facebook Platform Rules and general user privacy charters, we provide this public portal to request the permanent deletion of your social login data and associated records from the JourneyFlicker servers.
              </p>
              <p className="font-semibold text-black dark:text-white text-xs tracking-wider uppercase">
                To delete your associated JourneyFlicker App data:
              </p>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  Navigate to your Facebook Profile’s <span className="font-medium text-black dark:text-white">Settings & Privacy &gt; Settings</span>.
                </li>
                <li>
                  Access <span className="font-medium text-black dark:text-white">Apps and Websites</span> to view active integrations.
                </li>
                <li>
                  Locate <span className="font-medium text-black dark:text-white">JourneyFlicker</span> and trigger the <span className="font-medium text-black dark:text-white">Remove</span> button.
                </li>
                <li>
                  To permanently purge your records from our internal files, please complete the interactive **Data Deletion Request Form** on this page.
                </li>
              </ol>
              <p>
                Once processed, all bookings, curated dossiers, visas telemetry, and user metrics associated with your identity will be permanently and irreversibly purged from our databases within 7 business days.
              </p>
            </div>

            <div className="border border-outline-variant/30 dark:border-white/10 p-5 rounded-xl bg-surface dark:bg-white/[0.02]">
              <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-primary block mb-2">Direct Inquiry Desk</span>
              <p className="text-xs font-light">
                If you encounter any issues utilizing the interactive portal, please write to our privacy officer directly:
                <a href="mailto:privacy@journeyflicker.com" className="text-primary block mt-1 hover:underline">privacy@journeyflicker.com</a>
              </p>
            </div>
          </div>

          {/* Right: Interactive Request Form */}
          <div className="lg:col-span-7 animate-reveal-up" style={{ animationDelay: '0.15s' }}>
            <div className="bg-surface dark:bg-white/[0.03] p-6 sm:p-8 md:p-10 rounded-2xl shadow-sm border border-outline-variant/20 dark:border-white/10">
              
              <div className="flex justify-between items-center mb-6">
                <span className="text-primary text-[10px] font-black tracking-[0.5em] uppercase">Purge Initiation</span>
                <span className="text-[9px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Irreversible Action</span>
              </div>

              {submitted ? (
                <div className="py-12 text-center space-y-6">
                  <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/25">
                    <span className="material-symbols-outlined text-3xl text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-light tracking-tighter text-black dark:text-white">Deletion Initiated</h3>
                    <p className="text-xs text-on-surface-variant opacity-75 max-w-sm mx-auto leading-relaxed">
                      Your deletion ticket is successfully cataloged. All data associated with your email will be purged from active nodes within 7 business days.
                    </p>
                  </div>

                  <div className="bg-surface-container-low dark:bg-white/5 py-3 px-6 rounded-xl border border-outline-variant/10 max-w-xs mx-auto text-center">
                    <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-on-surface-variant block mb-1">Dossier Ticket Reference</span>
                    <span className="text-sm font-mono font-bold tracking-widest text-primary">{ticketId}</span>
                  </div>

                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-[9px] font-black tracking-[0.4em] uppercase border-b border-black dark:border-white pb-1 hover:text-primary transition-colors pt-4"
                  >
                    Initiate Another Request
                  </button>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Name */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold tracking-[0.4em] uppercase text-on-surface-variant block">Full Name</label>
                      <input 
                        type="text" 
                        placeholder="Full Name"
                        {...register('name')}
                        className={`w-full bg-surface-container-low dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm font-light focus:ring-2 focus:ring-primary/20 dark:focus:ring-white/20 outline-none placeholder:opacity-30 dark:text-white ${errors.name ? 'ring-2 ring-red-500/50 focus:ring-red-500/50' : ''}`} 
                      />
                      {errors.name && <p className="text-red-500 text-[10px] tracking-wide mt-1">{errors.name.message}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold tracking-[0.4em] uppercase text-on-surface-variant block">Email Address</label>
                      <input 
                        type="email" 
                        placeholder="email@example.com"
                        {...register('email')}
                        className={`w-full bg-surface-container-low dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm font-light focus:ring-2 focus:ring-primary/20 dark:focus:ring-white/20 outline-none placeholder:opacity-30 dark:text-white ${errors.email ? 'ring-2 ring-red-500/50 focus:ring-red-500/50' : ''}`} 
                      />
                      {errors.email && <p className="text-red-500 text-[10px] tracking-wide mt-1">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Facebook ID */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold tracking-[0.4em] uppercase text-on-surface-variant block">
                        Facebook ID <span className="opacity-40 italic lowercase font-light">(optional)</span>
                      </label>
                      <input 
                        type="text" 
                        placeholder="Numeric ID or profile name"
                        {...register('facebookId')}
                        className="w-full bg-surface-container-low dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm font-light focus:ring-2 focus:ring-primary/20 dark:focus:ring-white/20 outline-none placeholder:opacity-30 dark:text-white" 
                      />
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold tracking-[0.4em] uppercase text-on-surface-variant block">Reason for Deletion</label>
                      <select 
                        {...register('reason')}
                        className="w-full bg-surface-container-low dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm font-light focus:ring-2 focus:ring-primary/20 dark:focus:ring-white/20 outline-none appearance-none cursor-pointer dark:text-white"
                      >
                        <option>Account Retirement</option>
                        <option>Privacy Concerns</option>
                        <option>Curator Disengagement</option>
                        <option>Meta Platform Disconnect</option>
                        <option>Other / General Purge</option>
                      </select>
                    </div>
                  </div>

                  {/* Message Details */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold tracking-[0.4em] uppercase text-on-surface-variant block">Additional Context</label>
                    <textarea 
                      rows={4} 
                      placeholder="Please share any specifics regarding the scope of data you wish deleted..."
                      {...register('details')}
                      className="w-full bg-surface-container-low dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm font-light focus:ring-2 focus:ring-primary/20 dark:focus:ring-white/20 outline-none resize-none placeholder:opacity-30 dark:text-white" 
                    />
                  </div>

                  {/* Checkbox for Confirmation */}
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        {...register('confirm')}
                        className="w-4 h-4 rounded border-outline-variant/40 text-primary focus:ring-primary/20 bg-surface-container-low dark:bg-white/5 mt-0.5 cursor-pointer shrink-0" 
                      />
                      <span className="text-xs font-light text-on-surface-variant group-hover:text-on-surface dark:group-hover:text-white transition-colors select-none leading-relaxed">
                        I confirm that this action is permanent. I understand that all bookings, visas dossiers, and personalized travel curation assets associated with this identity will be permanently erased.
                      </span>
                    </label>
                    {errors.confirm && <p className="text-red-500 text-[10px] tracking-wide mt-1">{errors.confirm.message}</p>}
                  </div>

                  {/* Submission Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-outline-variant/10 dark:border-white/5">
                    <p className="text-[8px] text-on-surface-variant tracking-[0.3em] font-bold uppercase max-w-[220px] leading-relaxed opacity-40">
                      Request logged securely under curator index.
                    </p>
                    
                    <button 
                      type="submit" 
                      disabled={sending}
                      className="bg-black dark:bg-white text-white dark:text-black px-8 py-3.5 rounded-full text-[10px] font-black tracking-[0.4em] uppercase hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all shadow-md active:scale-95 w-full sm:w-auto disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {sending ? (
                        <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span> Processing...</>
                      ) : 'Authorize Purge Protocol'}
                    </button>
                  </div>

                </form>
              )}

            </div>
          </div>

        </div>
      </section>
    </>
  );
}
