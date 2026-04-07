import React from 'react';

/**
 * Shown when the app cannot run (missing env). Normal UI uses Firebase + Firestore only.
 */
export default function FirebaseBootstrap({ kind }) {
  const missingFirebase = kind === 'missingFirebase';
  return (
    <main className="firebase-bootstrap">
      <div className="firebase-bootstrap-inner">
        <h1>Configuration required</h1>
        {missingFirebase ? (
          <p>
            Firebase is not configured. Copy <code>.env.example</code> to <code>.env.local</code> and add your web app
            keys from the Firebase console as <code>REACT_APP_FIREBASE_*</code> variables. On Vercel, add the same names
            under Project → Settings → Environment Variables, then redeploy.
          </p>
        ) : (
          <p>
            Set <code>REACT_APP_FIREBASE_USE_AUTH=true</code> and enable Email/Password in Firebase Authentication so
            admins can sign in.
          </p>
        )}
      </div>
    </main>
  );
}
