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
            Firebase could not be initialized. Verify project keys in Vercel environment variables and confirm Firestore
            + Storage are enabled in the same Firebase project.
          </p>
        ) : null}
      </div>
    </main>
  );
}
