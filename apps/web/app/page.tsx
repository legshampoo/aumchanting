import { LandingPage } from "./components/LandingPage";
import { UpcomingEvents } from "./components/UpcomingEvents";

export default function Home() {
  return (
    <LandingPage>
      <UpcomingEvents />
    </LandingPage>
  );
}
