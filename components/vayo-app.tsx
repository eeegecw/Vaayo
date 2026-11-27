"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight, ArrowUpRight, Bell, CalendarClock, CarFront, ChevronUp,
  CheckCircle2, Clock3, KeyRound, Loader2, LogOut, MapPin, Menu,
  Navigation, ShieldCheck, Users, Wallet, X,
  ClipboardList, AlertCircle, Phone, Mail
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Role = "customer" | "driver" | "admin";
type View = "home" | "bookings" | "driver" | "admin";
type ServiceType = "one_way" | "hourly" | "full_day";
type Profile = { id: string; full_name: string | null; phone: string | null; role: Role };
type Booking = {
  id: string; customer_id: string; driver_id: string | null; service_type: ServiceType;
  pickup: string; destination: string | null; scheduled_at: string | null;
  duration_hours: number | null; status: string; quoted_fare: number | null; created_at: string;
};
type DriverApplication = {
  id: string; user_id: string; full_name: string; license_number: string;
  status: string; created_at: string;
};
type DriverProfile = { id: string; full_name: string | null; phone: string | null };

const services: { id: ServiceType; title: string; description: string }[] = [
  { id: "one_way", title: "One-way", description: "A professional driver for a single journey." },
  { id: "hourly", title: "Hourly", description: "Keep a driver with you for as long as you need." },
  { id: "full_day", title: "Full-day", description: "A dedicated driver for your day out." },
];

const prettyStatus = (status: string) => status.replaceAll("_", " ");
const rupees = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export default function VayoApp() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const configured = Boolean(supabase);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [view, setView] = useState<View>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [service, setService] = useState<ServiceType>("one_way");
  const [pickup, setPickup] = useState("Mananthavady");
  const [destination, setDestination] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationHours, setDurationHours] = useState("2");
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [notice, setNotice] = useState("");
  const [appName, setAppName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [applicationBusy, setApplicationBusy] = useState(false);
  const [application, setApplication] = useState<DriverApplication | null>(null);
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [quoteDrafts, setQuoteDrafts] = useState<Record<string, string>>({});
  const [assignDrafts, setAssignDrafts] = useState<Record<string, string>>({});
  const [adminBusyId, setAdminBusyId] = useState("");

  useEffect(() => {
    const appRoot = document.querySelector(".app-shell");
    if (!appRoot) return;

    appRoot.classList.add("motion-ready");

    const revealTargets = appRoot.querySelectorAll<HTMLElement>([
      ".pricing-heading",
      ".pricing-card",
      ".section-head",
      ".service-card",
      ".booking-panel",
      ".help-heading",
      ".help-card",
      ".footer-brand-block",
      ".footer-column",
      ".footer-contact",
      ".footer-presence",
      ".footer-bottom",
      ".page-heading",
      ".stat-card",
      ".data-panel",
      ".application-card"
    ].join(", "));

    if (!("IntersectionObserver" in window)) {
      revealTargets.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -36px 0px",
    });

    revealTargets.forEach((element) => {
      element.classList.add("reveal-on-scroll");
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [view, authOpen, menuOpen]);

  const hydrateAccount = useCallback(async (currentUser: User) => {
    if (!supabase) return;
    setUser(currentUser);
    const { data } = await supabase.from("profiles")
      .select("id,full_name,phone,role").eq("id", currentUser.id).maybeSingle();
    const nextProfile = (data as Profile | null) ?? {
      id: currentUser.id, full_name: null, phone: currentUser.phone ?? null, role: "customer" as Role,
    };
    setProfile(nextProfile);
    if (nextProfile.role === "admin") setView("admin");
    else if (nextProfile.role === "driver") setView("driver");
    else setView("home");
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session?.user) void hydrateAccount(data.session.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) void hydrateAccount(session.user);
      else { setUser(null); setProfile(null); setBookings([]); setApplication(null); setView("home"); }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [supabase, hydrateAccount]);

  const refreshBookings = useCallback(async () => {
    if (!supabase || !user) return;
    setLoadingBookings(true);
    const { data, error } = await supabase.from("bookings")
      .select("id,customer_id,driver_id,service_type,pickup,destination,scheduled_at,duration_hours,status,quoted_fare,created_at")
      .order("created_at", { ascending: false }).limit(100);
    if (error) setNotice(error.message);
    else setBookings((data ?? []) as Booking[]);
    setLoadingBookings(false);
  }, [supabase, user]);

  const refreshDriverData = useCallback(async () => {
    if (!supabase || !user) return;
    const { data } = await supabase.from("driver_applications")
      .select("id,user_id,full_name,license_number,status,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    setApplication((data as DriverApplication | null) ?? null);
  }, [supabase, user]);

  const refreshAdminData = useCallback(async () => {
    if (!supabase || profile?.role !== "admin") return;
    const [{ data: appData }, { data: driverData }] = await Promise.all([
      supabase.from("driver_applications").select("id,user_id,full_name,license_number,status,created_at").eq("status", "pending").order("created_at"),
      supabase.from("profiles").select("id,full_name,phone").eq("role", "driver").order("full_name"),
    ]);
    setApplications((appData ?? []) as DriverApplication[]);
    setDrivers((driverData ?? []) as DriverProfile[]);
  }, [supabase, profile?.role]);

  useEffect(() => {
    if (!user) return;
    void refreshBookings();
    if (profile?.role === "customer") void refreshDriverData();
    if (profile?.role === "admin") void refreshAdminData();
  }, [user, profile?.role, refreshBookings, refreshDriverData, refreshAdminData]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setAuthMessage("");

    if (!supabase) {
      setAuthError("Supabase is not connected yet. Add the project URL and publishable key to .env.local first.");
      return;
    }
    if (password.length < 8) {
      setAuthError("Use a password with at least 8 characters.");
      return;
    }
    if (authMode === "signup" && !username.trim()) {
      setAuthError("Enter a username or display name.");
      return;
    }

    setAuthBusy(true);
    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: username.trim() } },
      });
      setAuthBusy(false);
      if (error) {
        setAuthError(error.message);
        return;
      }
      if (data.session && data.user) {
        await hydrateAccount(data.user);
        setAuthOpen(false);
        setPassword("");
        setAuthMessage("Your VAYO account is ready.");
      } else {
        setAuthMessage("Account created. Check your email for a confirmation link before signing in.");
      }
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setAuthBusy(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    if (data.user) await hydrateAccount(data.user);
    setAuthOpen(false);
    setPassword("");
    setAuthMessage("You're signed in.");
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setUser(null); setProfile(null); setBookings([]); setView("home");
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice("");
    if (!user) { setAuthOpen(true); setAuthMode("signin"); setAuthError("Sign in with your email and password to request a driver."); return; }
    if (!supabase) return;
    if (!pickup.trim() || (service === "one_way" && !destination.trim())) {
      setNotice("Please enter your pickup and destination."); return;
    }
    setBookingBusy(true);
    const { error } = await supabase.from("bookings").insert({
      customer_id: user.id, service_type: service, pickup: pickup.trim(),
      destination: destination.trim() || null,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      duration_hours: service === "hourly" ? Number(durationHours) : null,
      status: "requested",
    });
    setBookingBusy(false);
    if (error) setNotice(error.message);
    else {
      setNotice("Your request has been sent. The VAYO team will review it and add the fare before confirming.");
      setDestination(""); setScheduledAt(""); setDurationHours("2"); setView("bookings"); await refreshBookings();
    }
  }

  async function submitDriverApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice("");
    if (!user || !supabase) { setAuthOpen(true); return; }
    if (!appName.trim() || !licenseNumber.trim()) { setNotice("Please complete both fields."); return; }
    setApplicationBusy(true);
    const { error } = await supabase.from("driver_applications").insert({
      user_id: user.id, full_name: appName.trim(), license_number: licenseNumber.trim(), status: "pending",
    });
    setApplicationBusy(false);
    if (error) setNotice(error.code === "23505" ? "You already have a driver application with us." : error.message);
    else { setNotice("Application submitted. Our team will verify your documents and contact you."); await refreshDriverData(); }
  }

  async function respondToQuote(bookingId: string, accept: boolean) {
    if (!supabase) return;
    const { error } = await supabase.rpc("respond_to_booking_quote", { p_booking_id: bookingId, p_accept: accept });
    if (error) setNotice(error.message);
    else { setNotice(accept ? "Quote accepted. VAYO will arrange your driver." : "Quote declined."); await refreshBookings(); }
  }

  async function updateQuote(booking: Booking) {
    if (!supabase || profile?.role !== "admin") return;
    const amount = Number(quoteDrafts[booking.id]);
    if (!Number.isFinite(amount) || amount <= 0) { setNotice("Enter a valid fare greater than zero."); return; }
    setAdminBusyId(booking.id);
    const { error } = await supabase.rpc("admin_set_booking_quote", {
      p_booking_id: booking.id,
      p_amount: amount,
    });
    setAdminBusyId("");
    if (error) setNotice(error.message);
    else { setNotice("Fare saved and sent to the customer."); await refreshBookings(); }
  }

  async function assignDriver(booking: Booking) {
    if (!supabase || profile?.role !== "admin") return;
    const driverId = assignDrafts[booking.id];
    if (!driverId) { setNotice("Choose a verified driver first."); return; }
    setAdminBusyId(booking.id);
    const { error } = await supabase.rpc("admin_assign_driver", {
      p_booking_id: booking.id,
      p_driver_id: driverId,
    });
    setAdminBusyId("");
    if (error) setNotice(error.message);
    else { setNotice("Driver assigned."); await refreshBookings(); }
  }

  async function reviewApplication(applicationId: string, approve: boolean) {
    if (!supabase) return;
    setAdminBusyId(applicationId);
    const { error } = await supabase.rpc("review_driver_application", {
      p_application_id: applicationId, p_approve: approve,
    });
    setAdminBusyId("");
    if (error) setNotice(error.message);
    else { setNotice(approve ? "Driver approved." : "Application rejected."); await refreshAdminData(); }
  }

  async function driverProgress(bookingId: string, nextStatus: "in_progress" | "completed") {
    if (!supabase) return;
    setAdminBusyId(bookingId);
    const { error } = await supabase.rpc("driver_update_booking_status", {
      p_booking_id: bookingId, p_new_status: nextStatus,
    });
    setAdminBusyId("");
    if (error) setNotice(error.message);
    else { setNotice("Trip status updated."); await refreshBookings(); }
  }

  const myBookings = bookings.filter((b) => profile?.role === "admin" || b.customer_id === user?.id);
  const assignedBookings = bookings.filter((b) => b.driver_id === user?.id);
  const pendingCount = bookings.filter((b) => b.status === "requested").length;
  const revenueQuotes = bookings.filter((b) => b.quoted_fare !== null).length;

  function go(next: View) {
    setView(next); setMenuOpen(false); setNotice("");
    if (next === "bookings") void refreshBookings();
    if (next === "admin") void refreshAdminData();
    if (next === "driver") void refreshBookings();
  }

  function goToHomeSection(sectionId: string) {
    setView("home");
    setMenuOpen(false);
    setNotice("");
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  return (
    <div className="app-shell" id="top">
      <header className="topbar">
        <a href="#" className="brand" onClick={(e) => { e.preventDefault(); go("home"); }}>
          <span className="brand-mark">V</span><span><span className="brand-name">VAYO</span><span className="brand-tag">PERSONAL DRIVER SERVICE</span></span>
        </a>
        <div className="top-actions">
          <span className="location-pill"><MapPin size={13}/> Mananthavady, Wayanad</span>
          <div className="desktop-links">
            <button className="nav-link" onClick={() => goToHomeSection("services")}>Services</button>
            <button className="nav-link" onClick={() => goToHomeSection("charges")}>Charges</button>
            <button className="nav-link" onClick={() => goToHomeSection("help")}>Help</button>
            {user && <button className={`nav-link ${view === "bookings" ? "active" : ""}`} onClick={() => go("bookings")}>My bookings</button>}
            {user && profile?.role === "driver" && <button className={`nav-link ${view === "driver" ? "active" : ""}`} onClick={() => go("driver")}>Driver desk</button>}
            {user && profile?.role === "admin" && <button className={`nav-link ${view === "admin" ? "active" : ""}`} onClick={() => go("admin")}>Admin</button>}
          </div>
          {user ? <button className="button button-outline" onClick={signOut}><LogOut size={14}/> Sign out</button> : <button className="button button-dark" onClick={() => { setAuthMode("signin"); setAuthError(""); setAuthMessage(""); setAuthOpen(true); }}><KeyRound size={14}/> Sign in</button>}
          <button className="mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}><Menu size={18}/></button>
        </div>
        {menuOpen && <div className="mobile-dropdown">
          <button onClick={() => goToHomeSection("services")}>Services</button>
          <button onClick={() => goToHomeSection("charges")}>Charges</button>
          <button onClick={() => goToHomeSection("help")}>Help</button>
          {user && <button onClick={() => go("bookings")}>My bookings</button>}
          {user && profile?.role === "driver" && <button onClick={() => go("driver")}>Driver desk</button>}
          {user && profile?.role === "admin" && <button onClick={() => go("admin")}>Admin dashboard</button>}
          {user ? <button onClick={signOut}>Sign out</button> : <button onClick={() => { setAuthOpen(true); setMenuOpen(false); }}>Sign in</button>}
        </div>}
      </header>

      {!configured && <div className="notice" style={{ margin: "16px 5.5vw 0" }}><AlertCircle size={16}/> Preview mode: connect Supabase to activate email/password accounts, save bookings and use the driver/admin workflows. Add your project URL and publishable key to <strong>.env.local</strong>.</div>}
      {notice && <div className="alert success" style={{ margin: "15px 5.5vw 0" }}>{notice}</div>}

      {view === "home" && (
        <>
          <main className="hero">
            <div className="hero-copy-column">
              <div className="eyebrow">A personal driver service in Wayanad</div>
              <h1>Someone to drive your car.<br/><em>That&apos;s VAYO.</em></h1>
              <p className="hero-copy">Need a driver for your own car? Request one with VAYO. Choose a one-way trip, book by the hour, or keep a driver for the day. We&apos;re starting in Mananthavady.</p>
              <div className="hero-cta">
                <button className="button button-dark" onClick={() => document.getElementById("book-driver")?.scrollIntoView({ behavior: "smooth" })}>Book a driver <ArrowRight size={15}/></button>
                <button className="button button-outline" onClick={() => user ? go("driver") : setAuthOpen(true)}>Become a driver <ArrowUpRight size={15}/></button>
              </div>
              <div className="trust-row">
                <span className="trust-item"><ShieldCheck size={14}/> Driver applications reviewed</span>
                <span className="trust-item"><MapPin size={14}/> Starting in Mananthavady</span>
              </div>
            </div>
            <aside className="hero-visual" aria-label="How VAYO works">
              <div className="hero-visual-top">
                <span>HOW IT WORKS</span>
                <span>MANANTHAVADY · WAYANAD</span>
              </div>
              <div className="hero-steps">
                <div className="hero-step">
                  <span className="hero-step-number">01</span>
                  <div><small>YOU SEND A REQUEST</small><strong>Tell us where you&apos;re going.</strong></div>
                </div>
                <div className="hero-step">
                  <span className="hero-step-number">02</span>
                  <div><small>WE SHARE THE FARE</small><strong>Review it before you decide.</strong></div>
                </div>
                <div className="hero-step">
                  <span className="hero-step-number">03</span>
                  <div><small>WE ARRANGE A DRIVER</small><strong>Your car stays yours.</strong></div>
                </div>
              </div>
              <div className="hero-visual-bottom"><span>VAYO / LOCAL DRIVER SERVICE</span><span>01 — 03</span></div>
            </aside>
          </main>

          <section className="pricing-section" id="charges">
            <div className="pricing-heading">
              <div className="eyebrow">Before you book</div>
              <h2>No guesswork on the fare.</h2>
              <p>Send us the details of your trip. The VAYO team will review the request and share a price for you to accept before the booking is confirmed.</p>
            </div>
            <div className="pricing-cards">
              <article className="pricing-card">
                <span className="pricing-step">01 / REQUEST</span>
                <h3>Tell us about the trip</h3>
                <p>Choose one-way, hourly or full-day service and share your pickup details.</p>
              </article>
              <article className="pricing-card">
                <span className="pricing-step">02 / REVIEW</span>
                <h3>See your fare first</h3>
                <p>We send you the fare through your VAYO account. No price is made up on this page.</p>
              </article>
              <article className="pricing-card">
                <span className="pricing-step">03 / DECIDE</span>
                <h3>Accept when ready</h3>
                <p>Review the quote and choose whether to accept it. The booking moves ahead after you agree.</p>
              </article>
            </div>
            <button className="pricing-cta" onClick={() => document.getElementById("book-driver")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              See booking form <ArrowRight size={16}/>
            </button>
          </section>

          <section className="section" id="services">
            <div className="section-head">
              <div>
                <div className="eyebrow">Choose what suits your day</div>
                <h2>Three ways to book.</h2>
                <p className="section-sub">The driver comes to you and drives the car you already own.</p>
              </div>
            </div>
            <div className="service-grid">
              {services.map((item, index) => <button key={item.id} className="service-card" onClick={() => { setService(item.id); document.getElementById("book-driver")?.scrollIntoView({ behavior: "smooth" }); }} style={{ textAlign: "left" }}>
                <span className="service-number">0{index + 1} / 03</span>
                <h3>{item.title}</h3>
                <p>{item.id === "one_way" ? "A driver for one trip from your pickup point to your destination." : item.id === "hourly" ? "Keep a driver with you for the number of hours you need." : "Book a driver for the day, for errands, visits or a longer outing."}</p>
                <span className="service-card-link">Choose this service <ArrowRight size={14}/></span>
              </button>)}
            </div>
          </section>

          <section className="booking-wrap" id="book-driver">
            <div className="booking-panel">
              <aside className="booking-aside">
                <div className="eyebrow">Make a request</div>
                <h2>We&apos;ll take it from here.</h2>
                <p>Share the basics of your trip. The VAYO team will check the details, send you a fare and arrange a driver once you accept.</p>
                <div className="aside-note"><ShieldCheck size={17}/> Driver applications are reviewed before approval.</div>
              </aside>
              <form className="booking-form" onSubmit={submitBooking}>
                <h3 className="form-title">Where do you need a driver?</h3><p className="form-sub">This request is for a driver to take your own car.</p>
                <div className="service-options">
                  {services.map((item, index) => <button type="button" key={item.id} className={`service-option ${service === item.id ? "selected" : ""}`} onClick={() => setService(item.id)}>
                    {index === 0 ? <Navigation size={16}/> : index === 1 ? <Clock3 size={16}/> : <CalendarClock size={16}/>}<strong>{item.title}</strong>
                  </button>)}
                </div>
                <div className="field-grid">
                  <div className="field"><label htmlFor="pickup">PICKUP LOCATION</label><input id="pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="e.g. Mananthavady" required/></div>
                  <div className="field"><label htmlFor="destination">DESTINATION {service !== "one_way" && "(OPTIONAL)"}</label><input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Where are you headed?" required={service === "one_way"}/></div>
                </div>
                {service === "hourly" && <div className="field"><label htmlFor="duration">HOW MANY HOURS?</label><select id="duration" value={durationHours} onChange={(e) => setDurationHours(e.target.value)}>{Array.from({ length: 12 }, (_, i) => i + 1).map((hours) => <option key={hours} value={String(hours)}>{hours} {hours === 1 ? "hour" : "hours"}</option>)}</select></div>}
                <div className="field"><label htmlFor="datetime">WHEN DO YOU NEED A DRIVER?</label><input id="datetime" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}/></div>
                <div className="form-foot"><span className="form-hint">No fare is charged at this stage. VAYO will share the admin-approved price with you.</span><button className="button button-dark" type="submit" disabled={bookingBusy}>{bookingBusy ? <Loader2 size={15} className="spinner"/> : null} Request a driver <ArrowRight size={14}/></button></div>
              </form>
            </div>
          </section>

          <section className="help-section" id="help">
            <div className="help-heading">
              <div className="eyebrow">A real person is behind the service</div>
              <h2>Need a hand?</h2>
              <p>Whether you need a driver or would like to work with us, here&apos;s where to start.</p>
            </div>
            <div className="help-cards">
              <article className="help-card">
                <span className="help-icon help-icon-dark"><Phone size={22} fill="currentColor"/></span>
                <div className="help-card-copy">
                  <span className="help-card-label">FOR CUSTOMERS</span>
                  <h3>Looking for a driver?</h3>
                  <p>Send us your trip details and we’ll get back to you with a fare.</p>
                  <button onClick={() => document.getElementById("book-driver")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Make a booking request <ArrowRight size={14}/></button>
                </div>
              </article>
              <article className="help-card">
                <span className="help-icon help-icon-accent"><Mail size={22} fill="currentColor"/></span>
                <div className="help-card-copy">
                  <span className="help-card-label">FOR DRIVERS</span>
                  <h3>Interested in driving?</h3>
                  <p>Apply to join the local driver network. We’ll review your details before approval.</p>
                  <button onClick={() => go("driver")}>Read about applying <ArrowRight size={14}/></button>
                </div>
              </article>
            </div>
          </section>
        </>
      )}

      {view === "bookings" && (
        <main className="page-content">
          <div className="page-heading"><div><div className="eyebrow">Your VAYO account</div><h1>My bookings</h1><p className="section-sub">Track requests, review fares and see your trip history.</p></div><button className="button button-dark" onClick={() => go("home")}>New booking <ArrowRight size={14}/></button></div>
          <div className="dashboard-grid">
            <div className="stat-card"><ClipboardList className="stat-icon" size={19}/><div className="stat-label">Total bookings</div><div className="stat-value">{myBookings.length}</div></div>
            <div className="stat-card"><Clock3 className="stat-icon" size={19}/><div className="stat-label">Awaiting fare</div><div className="stat-value">{myBookings.filter((b) => b.status === "requested").length}</div></div>
            <div className="stat-card"><CheckCircle2 className="stat-icon" size={19}/><div className="stat-label">Quoted fares</div><div className="stat-value">{myBookings.filter((b) => b.quoted_fare !== null).length}</div></div>
          </div>
          <div className="data-panel"><div className="data-panel-head"><h3>Booking history</h3><button className="small-button" onClick={() => void refreshBookings()}><Bell size={12}/> Refresh</button></div>
            {loadingBookings ? <div className="empty-state"><Loader2 className="spinner" size={20}/><p>Loading bookings…</p></div> : myBookings.length === 0 ? <div className="empty-state"><span className="empty-icon"><CarFront size={22}/></span><div>No bookings yet</div><p>Your driver requests will appear here.</p></div> : <div className="table-wrap"><table><thead><tr><th>BOOKING</th><th>SERVICE</th><th>JOURNEY</th><th>DATE</th><th>FARE</th><th>STATUS / ACTION</th></tr></thead><tbody>{myBookings.map((b) => <tr key={b.id}><td>#{b.id.slice(0, 7).toUpperCase()}</td><td>{services.find((s) => s.id === b.service_type)?.title ?? b.service_type}{b.duration_hours ? ` · ${b.duration_hours}h` : ""}</td><td>{b.pickup} → {b.destination || "Flexible"}</td><td>{b.scheduled_at ? new Date(b.scheduled_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "AS SOON AS POSSIBLE"}</td><td>{b.quoted_fare !== null ? rupees(b.quoted_fare) : "Pending"}</td><td>{b.status === "quoted" && profile?.role === "customer" ? <div className="inline-control"><button className="small-button" onClick={() => void respondToQuote(b.id, true)}>Accept</button><button className="small-button" style={{ background: "#eee", color: "#555" }} onClick={() => void respondToQuote(b.id, false)}>Decline</button></div> : <span className={`status ${b.status}`}>{prettyStatus(b.status)}</span>}</td></tr>)}</tbody></table></div>}
          </div>
        </main>
      )}

      {view === "driver" && (
        <main className="page-content">
          <div className="page-heading"><div><div className="eyebrow">Partner with VAYO</div><h1>Driver desk</h1><p className="section-sub">Manage your driver application and assigned trips.</p></div><span className="status approved">{profile?.role === "driver" ? "Verified partner" : "Driver application"}</span></div>
          {profile?.role !== "driver" ? <div className="application-card">
            <div className="service-icon"><CarFront size={21}/></div><h2>Drive with VAYO</h2><p>Apply to become a VAYO driver in Mananthavady. Our team will verify your identity and driving documents before activating your driver account.</p>
            {application ? <><div className={`status ${application.status}`}>{prettyStatus(application.status)}</div><div className="notice"><ShieldCheck size={16}/> Your application is on file. You can use this page to check the review status. Approval is completed by the VAYO admin team.</div></> : <form onSubmit={submitDriverApplication}>
              <div className="field"><label htmlFor="drivername">FULL NAME</label><input id="drivername" value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="Name as on your licence" required/></div>
              <div className="field"><label htmlFor="licence">DRIVING LICENCE NUMBER</label><input id="licence" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="Enter your licence number" required/></div>
              <div className="notice"><ShieldCheck size={16}/> Do not upload document photos in this prototype. Secure document upload and verification will be added before pilot launch.</div>
              <button className="button button-dark" type="submit" disabled={applicationBusy}>{applicationBusy ? <Loader2 size={14} className="spinner"/> : null} Submit driver application <ArrowRight size={14}/></button>
            </form>}
          </div> : <>
            <div className="dashboard-grid"><div className="stat-card"><CarFront className="stat-icon" size={19}/><div className="stat-label">Assigned trips</div><div className="stat-value">{assignedBookings.length}</div></div><div className="stat-card"><CheckCircle2 className="stat-icon" size={19}/><div className="stat-label">Completed</div><div className="stat-value">{assignedBookings.filter((b) => b.status === "completed").length}</div></div><div className="stat-card"><Wallet className="stat-icon" size={19}/><div className="stat-label">Earnings</div><div className="stat-value">—</div></div></div>
            <div className="data-panel"><div className="data-panel-head"><h3>Your assigned trips</h3><button className="small-button" onClick={() => void refreshBookings()}>Refresh</button></div>
              {assignedBookings.length === 0 ? <div className="empty-state"><span className="empty-icon"><Navigation size={21}/></span><div>No assigned trips yet</div><p>New trips assigned by VAYO will appear here.</p></div> : <div className="table-wrap"><table><thead><tr><th>PICKUP</th><th>DESTINATION</th><th>SCHEDULE</th><th>FARE</th><th>ACTION</th></tr></thead><tbody>{assignedBookings.map((b) => <tr key={b.id}><td>{b.pickup}</td><td>{b.destination || "Flexible"}</td><td>{b.scheduled_at ? new Date(b.scheduled_at).toLocaleString("en-IN") : "Immediate"}</td><td>{b.quoted_fare ? rupees(b.quoted_fare) : "—"}</td><td>{b.status === "assigned" ? <button className="small-button" disabled={adminBusyId === b.id} onClick={() => void driverProgress(b.id, "in_progress")}>Start trip</button> : b.status === "in_progress" ? <button className="small-button" disabled={adminBusyId === b.id} onClick={() => void driverProgress(b.id, "completed")}>Complete trip</button> : <span className={`status ${b.status}`}>{prettyStatus(b.status)}</span>}</td></tr>)}</tbody></table></div>}
            </div>
          </>}
        </main>
      )}

      {view === "admin" && (
        <main className="page-content">
          {profile?.role !== "admin" ? <div className="application-card"><span className="empty-icon"><ShieldCheck size={22}/></span><h2>Admin access required</h2><p>This area is restricted to authorized VAYO administrators. Admin role must be granted securely in the Supabase database.</p></div> : <>
            <div className="page-heading"><div><div className="eyebrow">Operations control</div><h1>Admin dashboard</h1><p className="section-sub">Review requests, set fares and approve driver partners.</p></div><button className="button button-outline" onClick={() => { void refreshBookings(); void refreshAdminData(); }}>Refresh data</button></div>
            <div className="dashboard-grid"><div className="stat-card"><ClipboardList className="stat-icon" size={19}/><div className="stat-label">All bookings</div><div className="stat-value">{bookings.length}</div></div><div className="stat-card"><Clock3 className="stat-icon" size={19}/><div className="stat-label">New requests</div><div className="stat-value">{pendingCount}</div></div><div className="stat-card"><Users className="stat-icon" size={19}/><div className="stat-label">Verified drivers</div><div className="stat-value">{drivers.length}</div></div></div>
            <div className="data-panel" style={{ marginBottom: 22 }}><div className="data-panel-head"><h3>Booking requests & fare control</h3><span className="section-sub">{revenueQuotes} fares quoted</span></div>
              {bookings.length === 0 ? <div className="empty-state">No booking requests yet.</div> : <div className="table-wrap"><table><thead><tr><th>BOOKING</th><th>SERVICE</th><th>JOURNEY</th><th>STATUS</th><th>SET FARE (₹)</th><th>ASSIGN DRIVER</th></tr></thead><tbody>{bookings.map((b) => <tr key={b.id}><td>#{b.id.slice(0,7).toUpperCase()}</td><td>{services.find((s) => s.id === b.service_type)?.title}{b.duration_hours ? ` · ${b.duration_hours}h` : ""}</td><td>{b.pickup} → {b.destination || "Flexible"}</td><td><span className={`status ${b.status}`}>{prettyStatus(b.status)}</span></td><td>{b.status === "requested" ? <div className="inline-control"><input aria-label="Fare in rupees" type="number" min="1" placeholder="Amount" value={quoteDrafts[b.id] ?? ""} onChange={(e) => setQuoteDrafts({ ...quoteDrafts, [b.id]: e.target.value })}/><button className="small-button" disabled={adminBusyId === b.id} onClick={() => void updateQuote(b)}>Quote</button></div> : b.quoted_fare !== null ? rupees(b.quoted_fare) : "—"}</td><td>{b.status === "confirmed" ? <div className="inline-control"><select aria-label="Select driver" value={assignDrafts[b.id] ?? ""} onChange={(e) => setAssignDrafts({ ...assignDrafts, [b.id]: e.target.value })}><option value="">Choose driver</option>{drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name || d.phone || d.id.slice(0,6)}</option>)}</select><button className="small-button" disabled={adminBusyId === b.id || drivers.length === 0} onClick={() => void assignDriver(b)}>Assign</button></div> : b.driver_id ? "Assigned" : "—"}</td></tr>)}</tbody></table></div>}
            </div>
            <div className="data-panel"><div className="data-panel-head"><h3>Driver applications</h3><span className="status pending">{applications.length} pending</span></div>
              {applications.length === 0 ? <div className="empty-state">No pending driver applications.</div> : <div className="table-wrap"><table><thead><tr><th>APPLICANT</th><th>LICENCE NUMBER</th><th>SUBMITTED</th><th>REVIEW</th></tr></thead><tbody>{applications.map((a) => <tr key={a.id}><td>{a.full_name}</td><td>{a.license_number}</td><td>{new Date(a.created_at).toLocaleDateString("en-IN")}</td><td><div className="inline-control"><button className="small-button" disabled={adminBusyId === a.id} onClick={() => void reviewApplication(a.id, true)}>Approve</button><button className="small-button" style={{ background: "#eee", color: "#555" }} disabled={adminBusyId === a.id} onClick={() => void reviewApplication(a.id, false)}>Reject</button></div></td></tr>)}</tbody></table></div>}
            </div>
          </>}
        </main>
      )}

      <footer className="site-footer" id="site-footer">
        <div className="footer-main">
          <section className="footer-brand-block">
            <button className="footer-logo" onClick={() => goToHomeSection("top")} aria-label="VAYO home">
              <span className="brand-mark">V</span>
              <span className="brand-name">VAYO</span>
            </button>
            <p className="footer-description">A local service for people who need someone else to drive the car they already own.</p>
            <span className="footer-note">Starting in Mananthavady, Wayanad</span>
          </section>

          <nav className="footer-column" aria-label="Quick links">
            <h3>QUICK LINKS</h3>
            <button onClick={() => goToHomeSection("book-driver")}>Book a driver</button>
            <button onClick={() => goToHomeSection("services")}>Our services</button>
            <button onClick={() => user ? go("bookings") : (setAuthMode("signin"), setAuthOpen(true))}>My bookings</button>
            <button onClick={() => go("driver")}>Drive with VAYO</button>
          </nav>

          <section className="footer-column">
            <h3>SERVICE &amp; SAFETY</h3>
            <button onClick={() => goToHomeSection("services")}>One-way, hourly &amp; full-day</button>
            <button onClick={() => goToHomeSection("book-driver")}>Fare shared before confirmation</button>
            <button onClick={() => go("driver")}>Driver application &amp; verification</button>
            <p className="footer-column-note">Every driver application is reviewed by the VAYO team.</p>
          </section>

          <section className="footer-contact">
            <h3>CONTACT US</h3>
            <div className="footer-contact-row"><MapPin size={17}/><span>Mananthavady, Wayanad,<br/>Kerala, India</span></div>
            <div className="footer-contact-row"><ShieldCheck size={17}/><span>Need booking assistance?<br/>Sign in to manage your request.</span></div>
            <div className="footer-portal-label">VAYO PORTALS</div>
            <div className="footer-portal-actions">
              <button onClick={() => go("home")}>Customer portal <ArrowUpRight size={13}/></button>
              <button onClick={() => go("driver")}>Driver portal <ArrowUpRight size={13}/></button>
            </div>
          </section>
        </div>

        <div className="footer-presence">
          <h3>CURRENT SERVICE AREA</h3>
          <div className="footer-cities"><span>Mananthavady</span><span>Wayanad</span><span>Kerala</span></div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} VAYO. All rights reserved.</span>
          <span>Your car. Your journey. Our driver.</span>
          <button className="footer-back-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top"><ChevronUp size={20}/></button>
        </div>
      </footer>

      {authOpen && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setAuthOpen(false); }}>
        <div className="modal">
          <button className="modal-close" aria-label="Close" onClick={() => { setAuthOpen(false); setAuthError(""); setAuthMessage(""); }}><X size={16}/></button>
          <span className="brand-mark"><KeyRound size={20}/></span>
          <h2>{authMode === "signup" ? "Create your VAYO account" : "Welcome to VAYO"}</h2>
          <p>{authMode === "signup" ? "Create an account to book a driver or apply to drive with VAYO." : "Sign in to manage your bookings and driver account."}</p>
          <form onSubmit={submitAuth}>
            {authMode === "signup" && <div className="field"><label htmlFor="username">USERNAME / DISPLAY NAME</label><input id="username" className="input" type="text" autoComplete="name" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your name" minLength={2} maxLength={60} required/></div>}
            <div className="field"><label htmlFor="email">EMAIL ADDRESS</label><input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required/></div>
            <div className="field"><label htmlFor="password">PASSWORD</label><input id="password" className="input" type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required/></div>
            {authError && <div className="alert error">{authError}</div>}
            {authMessage && <div className="alert success">{authMessage}</div>}
            <button className="button button-dark" type="submit" style={{ width: "100%", marginTop: 7 }} disabled={authBusy}>
              {authBusy ? <Loader2 size={15} className="spinner"/> : <KeyRound size={14}/>} {authMode === "signup" ? "Create account" : "Sign in"} <ArrowRight size={14}/>
            </button>
          </form>
          <button className="nav-link" type="button" style={{ width: "100%", marginTop: 12 }} onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setAuthError(""); setAuthMessage(""); }}>
            {authMode === "signin" ? "New to VAYO? Create an account" : "Already registered? Sign in"}
          </button>
          <div className="notice"><ShieldCheck size={15}/> Passwords are managed securely by Supabase Auth. Your username is shown on your VAYO account; use your email address to sign in.</div>
        </div>
      </div>}
    </div>
  );
}
