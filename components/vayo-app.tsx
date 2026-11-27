"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight, ArrowUpRight, Bell, CalendarClock, CarFront, ChevronUp,
  CheckCircle2, Clock3, KeyRound, Loader2, LogOut, MapPin, Menu,
  Navigation, ShieldCheck, Sparkles, Users, Wallet, X,
  ClipboardList, AlertCircle, Facebook, Instagram, Linkedin, Youtube
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
            <button className={`nav-link ${view === "home" ? "active" : ""}`} onClick={() => go("home")}>Book a driver</button>
            {user && <button className={`nav-link ${view === "bookings" ? "active" : ""}`} onClick={() => go("bookings")}>My bookings</button>}
            {user && profile?.role === "driver" && <button className={`nav-link ${view === "driver" ? "active" : ""}`} onClick={() => go("driver")}>Driver desk</button>}
            {user && profile?.role === "admin" && <button className={`nav-link ${view === "admin" ? "active" : ""}`} onClick={() => go("admin")}>Admin</button>}
          </div>
          {user ? <button className="button button-outline" onClick={signOut}><LogOut size={14}/> Sign out</button> : <button className="button button-dark" onClick={() => { setAuthMode("signin"); setAuthError(""); setAuthMessage(""); setAuthOpen(true); }}><KeyRound size={14}/> Sign in</button>}
          <button className="mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}><Menu size={18}/></button>
        </div>
        {menuOpen && <div className="mobile-dropdown">
          <button onClick={() => go("home")}>Book a driver</button>
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
            <div>
              <div className="eyebrow">A better way to get there</div>
              <h1>Your car.<br/>Your journey.<br/><em>Our driver.</em></h1>
              <p className="hero-copy">A professional driver for the car you already own. Book a trusted driver for a quick trip, a few hours, or the whole day.</p>
              <div className="hero-cta">
                <button className="button button-dark" onClick={() => document.getElementById("book-driver")?.scrollIntoView({ behavior: "smooth" })}>Book your driver <ArrowRight size={15}/></button>
                <button className="button button-outline" onClick={() => user ? go("driver") : setAuthOpen(true)}>Drive with VAYO <ArrowUpRight size={15}/></button>
              </div>
              <div className="trust-row">
                <span className="trust-item"><ShieldCheck size={14}/> Verified drivers</span>
                <span className="trust-item"><Clock3 size={14}/> Flexible bookings</span>
                <span className="trust-item"><MapPin size={14}/> Starting in Wayanad</span>
              </div>
            </div>
            <div className="hero-visual">
              <div className="visual-top"><span className="visual-label">THE VAYO EXPERIENCE</span><span className="visual-status">● MANANTHAVADY</span></div>
              <div className="car-stage"><div className="car-glow"/><div className="car-illustration"><div className="car-window"/><div className="car-body"/><div className="car-wheel left"/><div className="car-wheel right"/></div></div>
              <div className="visual-bottom"><span>YOUR VEHICLE, YOUR RULES<strong>Arrive with ease.</strong></span><Sparkles size={22} color="#c8a873"/></div>
            </div>
          </main>

          <section className="section" id="services">
            <div className="section-head"><div><div className="eyebrow">One service, your way</div><h2>Choose how you travel.</h2><p className="section-sub">A driver that fits the day you have planned.</p></div></div>
            <div className="service-grid">
              {services.map((item, index) => <button key={item.id} className="service-card" onClick={() => { setService(item.id); document.getElementById("book-driver")?.scrollIntoView({ behavior: "smooth" }); }} style={{ textAlign: "left" }}>
                <span className="service-icon">{index === 0 ? <Navigation size={20}/> : index === 1 ? <Clock3 size={20}/> : <CalendarClock size={20}/>}</span>
                <h3>{item.title}</h3><p>{item.description}</p>
              </button>)}
            </div>
          </section>

          <section className="booking-wrap" id="book-driver">
            <div className="booking-panel">
              <aside className="booking-aside"><div className="eyebrow">Start with the details</div><h2>A good journey starts with the right driver.</h2><p>Tell us where you&apos;re going. Our team will review your request and confirm the fare before your booking is final.</p><div className="aside-note"><ShieldCheck size={17}/> Driver verification is part of every VAYO application.</div></aside>
              <form className="booking-form" onSubmit={submitBooking}>
                <h3 className="form-title">Book a driver</h3><p className="form-sub">Request a driver for your own car.</p>
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
            <p className="footer-description">A dependable driver for the car you already own. Your car, your journey — our responsibility.</p>
            <div className="footer-socials" aria-label="Social channels coming soon">
              <span title="Facebook profile coming soon"><Facebook size={17}/></span>
              <span title="Instagram profile coming soon"><Instagram size={17}/></span>
              <span title="X profile coming soon" className="footer-x-mark">X</span>
              <span title="LinkedIn profile coming soon"><Linkedin size={17}/></span>
              <span title="YouTube profile coming soon"><Youtube size={17}/></span>
            </div>
            <span className="footer-note">Social channels coming soon</span>
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
