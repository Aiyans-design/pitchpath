import './globals.css';
import Nav from '../components/Nav';
import ThemeBoot from '../components/ThemeBoot';

export const metadata={title:'Pitchpath',description:'A personal football development system for young players'};
export default function RootLayout({children}){return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/></head><body style={{paddingBottom:70}}><ThemeBoot/>{children}<Nav/></body></html>}
