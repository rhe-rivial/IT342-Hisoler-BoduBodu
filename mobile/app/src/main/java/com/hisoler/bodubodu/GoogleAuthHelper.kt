package com.hisoler.bodubodu

import android.app.Activity
import android.content.Intent
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException

object GoogleAuthHelper {
    const val RC_GOOGLE_SIGN_IN = 4001

    fun client(activity: Activity): GoogleSignInClient {
        val clientId = activity.getString(R.string.google_web_client_id)
        val options = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .requestIdToken(clientId)
            .build()
        return GoogleSignIn.getClient(activity, options)
    }

    fun signInIntent(activity: Activity): Intent = client(activity).signInIntent

    fun accountFromResult(data: Intent?): GoogleSignInAccount? {
        return try {
            GoogleSignIn.getSignedInAccountFromIntent(data).getResult(ApiException::class.java)
        } catch (_: ApiException) {
            null
        }
    }
}
