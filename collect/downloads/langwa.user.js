// ==UserScript==
// @name         Langwa
// @namespace    langwa
// @version      0.1.0
// @description  Read digital banking services in Cameroon's national languages, with amounts, fees and beneficiaries protected.
// @match        https://safinum.cm/*
// @match        http://localhost/*
// @match        http://127.0.0.1/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @run-at       document-idle
// @noframes
// ==/UserScript==
// To use it on another banking site, add the site in your userscript manager (User matches).

globalThis.LANGWA_DATA = {"source":{"about":"Source strings (French / English). Each national-language file (lang/<code>.json) maps an id to { t, verified, validator, audio }. {placeholders} are filled with the protected values from the page (amounts, names...) and MUST be kept in the translation. Strings marked \"check\": true were taken from an auto-translated view of the test page and must be compared with the page's real FR/EN text.","entries":[{"id":"gist_error","group":"safety-net","fr":"Ceci est un message d'erreur. L'opération n'a pas abouti.","en":"This is an error message. The operation did not go through.","note":"Phrase générale pour TOUTE nouvelle erreur inconnue : l’opération n’a pas marché."},{"id":"gist_warning","group":"safety-net","fr":"Avertissement de sécurité : lisez attentivement ou demandez de l'aide à une personne de confiance.","en":"Security warning: read carefully or ask someone you trust for help.","note":"Phrase générale utilisée pour TOUT nouvel avertissement de sécurité inconnu. Doit inviter à la prudence."},{"id":"gist_success","group":"safety-net","fr":"L'opération a réussi.","en":"The operation was successful."},{"id":"gist_info","group":"safety-net","fr":"Message d'information.","en":"Information message."},{"id":"gist_keywords","group":"safety-net","fr":"Mots clés :","en":"Key words:"},{"id":"test_banner","group":"test-env","fr":"Environnement de test : données fictives, aucune transaction réelle.","en":"Test environment: dummy data, no real transactions.","check":true,"variants":["Environnement de test — données fictives, aucune transaction réelle.","Test environment — dummy data, no real transactions."]},{"id":"test_protocol","group":"test-env","fr":"Protocole de test","en":"Test protocol","check":true},{"id":"back_hackathon","group":"test-env","fr":"Retour au hackathon","en":"Back to the hackathon","check":true},{"id":"online_banking","group":"test-env","fr":"Banque en ligne","en":"Online banking","check":true},{"id":"step_pay","group":"steps","fr":"Payer","en":"Pay","variants":["Paiement","Payment"],"note":"Étape 1 du parcours : payer / envoyer de l’argent. / Step 1 of the journey: paying."},{"id":"step_costs","group":"steps","fr":"Frais","en":"Fees","variants":["Costs"],"check":true,"note":"Étape où l’on voit ce que la banque prend pour l’opération. / Step showing what the bank charges."},{"id":"step_beneficiary","group":"steps","fr":"Bénéficiaire","en":"Beneficiary","note":"Étape où l’on dit qui reçoit l’argent. / Step where you say who receives the money."},{"id":"step_summary","group":"steps","fr":"Récapitulatif","en":"Summary","variants":["Résumé"]},{"id":"step_confirmation","group":"steps","fr":"Confirmation","en":"Confirmation"},{"id":"your_account","group":"balance","fr":"Votre compte","en":"Your account"},{"id":"hello_name","group":"balance","fr":"Bonjour, {name}","en":"Hello, {name}"},{"id":"intro_balance","group":"balance","fr":"Consultez votre solde et initiez un virement sécurisé.","en":"Check your balance and initiate a secure transfer.","check":true},{"id":"available_balance","group":"balance","fr":"Solde disponible","en":"Available balance","note":"L’argent que vous pouvez utiliser maintenant. / The money you can use right now."},{"id":"balance","group":"balance","fr":"Solde","en":"Balance","note":"L’argent qui est sur le compte. / The money in the account."},{"id":"account_number","group":"balance","fr":"Numéro de compte","en":"Account number","note":"Le numéro qui identifie le compte. / The number identifying the account."},{"id":"current_account","group":"balance","fr":"Compte courant","en":"Current account","note":"Le compte de tous les jours. / The everyday account."},{"id":"savings_account","group":"balance","fr":"Compte épargne","en":"Savings account"},{"id":"perform_transfer","group":"balance","fr":"Effectuer un virement","en":"Make a transfer","variants":["Perform a transfer","Faire un virement","Faire un transfert"],"check":true},{"id":"view_fees","group":"balance","fr":"Voir les frais","en":"View fees","check":true},{"id":"recent_transactions","group":"balance","fr":"Transactions récentes","en":"Recent transactions","variants":["Dernières opérations","Dernières transactions"],"check":true},{"id":"merchant_payment","group":"balance","fr":"Paiement marchand","en":"Merchant payment","check":true,"note":"Argent payé dans un magasin ou à un commerçant."},{"id":"salary_received","group":"balance","fr":"Salaire reçu","en":"Salary received","check":true,"note":"Le salaire est arrivé sur le compte (argent qui entre)."},{"id":"transfer_received","group":"balance","fr":"Virement reçu","en":"Transfer received","variants":["Transfert reçu"],"note":"Quelqu un vous a envoyé de l’argent (argent qui entre)."},{"id":"transfer_sent","group":"balance","fr":"Virement envoyé","en":"Transfer sent","variants":["Transfert envoyé"]},{"id":"electricity_bill","group":"balance","fr":"Facture d'électricité","en":"Electricity bill"},{"id":"water_bill","group":"balance","fr":"Facture d'eau","en":"Water bill"},{"id":"cash_withdrawal","group":"balance","fr":"Retrait d'espèces","en":"Cash withdrawal"},{"id":"deposit","group":"balance","fr":"Dépôt","en":"Deposit"},{"id":"airtime","group":"balance","fr":"Achat de crédit","en":"Airtime purchase"},{"id":"security","group":"security","fr":"Sécurité","en":"Security"},{"id":"security_check_beneficiary","group":"security","fr":"Vérifiez toujours le nom et le numéro du bénéficiaire avant de confirmer un virement.","en":"Always check the beneficiary's name and number before confirming a transfer.","check":true,"note":"Conseil de sécurité : regardez bien le nom et le numéro avant de valider."},{"id":"secure_connection","group":"security","fr":"Connexion sécurisée","en":"Secure connection"},{"id":"demo_footer","group":"security","fr":"Safinum Pay : environnement de démonstration. N'entrez aucune donnée personnelle réelle.","en":"Safinum Pay: demonstration environment. Do not enter any real personal data.","check":true,"variants":["Safinum Pay — environnement de démonstration. N'entrez aucune donnée personnelle réelle.","Safinum Pay — demonstration environment. Do not enter any real personal data."]},{"id":"never_share_pin","group":"security","fr":"Ne communiquez jamais votre code PIN, même à un agent de la banque.","en":"Never share your PIN, not even with a bank employee.","note":"Le code secret ne se donne à personne, même pas à quelqu’un de la banque. La négation est essentielle."},{"id":"fraud_warning","group":"security","fr":"Méfiez-vous des appels ou SMS qui vous demandent votre code secret.","en":"Beware of calls or text messages asking for your secret code.","note":"Si quelqu’un vous appelle pour demander votre code secret, c’est un voleur."},{"id":"irreversible","group":"security","fr":"Une fois confirmé, le virement ne peut pas être annulé.","en":"Once confirmed, the transfer cannot be cancelled.","note":"Après confirmation, impossible de récupérer l’argent. Le sens doit être très clair."},{"id":"check_details","group":"security","fr":"Vérifiez les informations avant de confirmer.","en":"Check the details before confirming."},{"id":"transfer_fees","group":"fees","fr":"Frais de virement","en":"Transfer fees","variants":["Frais de transfert"],"note":"Ce que la banque prend pour envoyer l’argent. / What the bank charges to send money."},{"id":"transaction_fees","group":"fees","fr":"Frais de transaction","en":"Transaction fees"},{"id":"fees","group":"fees","fr":"Frais","en":"Fees","variants":["Costs"],"note":"L’argent que la banque prend pour faire l’opération. / What the bank charges for the operation."},{"id":"choose_type_amount","group":"fees","fr":"Choisissez le type de virement et le montant. Les frais sont calculés automatiquement.","en":"Choose the transfer type and amount. Fees are calculated automatically.","check":true},{"id":"operation_type","group":"fees","fr":"Type d'opération","en":"Type of operation","variants":["Operation type"],"check":true},{"id":"safinum_account","group":"fees","fr":"Compte Safinum","en":"Safinum account","check":true},{"id":"instant_free","group":"fees","fr":"Virement instantané et gratuit","en":"Instant and free transfer","check":true,"note":"L’argent arrive tout de suite et la banque ne prend rien. / Arrives immediately, the bank charges nothing."},{"id":"other_bank","group":"fees","fr":"Compte d'une autre banque","en":"Account at another bank"},{"id":"mobile_money","group":"fees","fr":"Mobile Money","en":"Mobile Money"},{"id":"amount_to_send","group":"fees","fr":"Montant à envoyer","en":"Amount to send"},{"id":"amount","group":"fees","fr":"Montant","en":"Amount"},{"id":"free","group":"fees","fr":"Gratuit","en":"Free"},{"id":"total_debited","group":"fees","fr":"Total à débiter","en":"Total to be debited","variants":["Total débité","Total debited"],"check":true,"note":"Tout ce qui va sortir du compte : montant envoyé + frais. / Everything that will leave the account: amount + fees."},{"id":"balance_after","group":"fees","fr":"Solde après l'opération","en":"Balance after operation","variants":["Balance after the operation"],"check":true,"note":"L’argent qui restera sur le compte après cet envoi. / Money left after this transfer."},{"id":"fee_rate_min","group":"fees","fr":"{rate} du montant (minimum {min})","en":"{rate} of the amount (minimum {min})"},{"id":"beneficiary","group":"transfer","fr":"Bénéficiaire","en":"Beneficiary","note":"La personne qui va recevoir l’argent. / The person who will receive the money."},{"id":"beneficiary_name","group":"transfer","fr":"Nom du bénéficiaire","en":"Beneficiary name","variants":["Beneficiary's name","Name of the beneficiary"]},{"id":"phone_number","group":"transfer","fr":"Numéro de téléphone","en":"Phone number"},{"id":"account_or_phone","group":"transfer","fr":"Numéro de compte ou de téléphone","en":"Account or phone number"},{"id":"reason","group":"transfer","fr":"Motif","en":"Reason","variants":["Motif du virement","Purpose"]},{"id":"transfer_summary","group":"transfer","fr":"Récapitulatif du virement","en":"Transfer summary"},{"id":"send_amount_to","group":"transfer","fr":"Vous allez envoyer {amount} à {name}.","en":"You are about to send {amount} to {name}.","note":"Phrase de confirmation : qui reçoit et combien. Gardez {amount} et {name}. / Confirmation: who receives how much."},{"id":"pin_code","group":"transfer","fr":"Code PIN","en":"PIN code","variants":["PIN"],"note":"Le code secret de 4 chiffres. / The secret 4-digit code."},{"id":"enter_pin","group":"transfer","fr":"Saisissez votre code PIN","en":"Enter your PIN"},{"id":"accept_terms","group":"transfer","fr":"J'accepte les conditions générales.","en":"I accept the terms and conditions."},{"id":"terms","group":"transfer","fr":"Conditions générales","en":"Terms and conditions"},{"id":"back","group":"transfer","fr":"Retour","en":"Back"},{"id":"continue","group":"transfer","fr":"Continuer","en":"Continue"},{"id":"confirm","group":"transfer","fr":"Confirmer","en":"Confirm"},{"id":"confirm_transfer","group":"transfer","fr":"Confirmer le virement","en":"Confirm the transfer","variants":["Confirm transfer"]},{"id":"cancel","group":"transfer","fr":"Annuler","en":"Cancel"},{"id":"reference","group":"transfer","fr":"Référence","en":"Reference","note":"Le code de cette opération ; à donner si vous appelez la banque. / The code of this operation; give it if you call the bank."},{"id":"date","group":"transfer","fr":"Date","en":"Date"},{"id":"status","group":"transfer","fr":"Statut","en":"Status"},{"id":"transfer_success","group":"messages","fr":"Virement effectué avec succès.","en":"Transfer completed successfully.","variants":["Transfert effectué avec succès."]},{"id":"insufficient_balance","group":"messages","fr":"Solde insuffisant pour effectuer cette opération.","en":"Insufficient balance for this transaction.","variants":["Solde insuffisant.","Insufficient balance."],"note":"Il n’y a pas assez d’argent sur le compte pour cette opération."},{"id":"pin_incorrect_attempts","group":"messages","fr":"Code PIN incorrect. Il vous reste {count} tentatives.","en":"Incorrect PIN. You have {count} attempts left.","note":"Le code secret est faux ; dire combien d’essais restent avant blocage. Gardez {count}."},{"id":"pin_incorrect","group":"messages","fr":"Code PIN incorrect.","en":"Incorrect PIN."},{"id":"account_locked","group":"messages","fr":"Votre compte est temporairement bloqué.","en":"Your account is temporarily locked."},{"id":"required_field","group":"messages","fr":"Ce champ est obligatoire.","en":"This field is required."},{"id":"invalid_amount","group":"messages","fr":"Montant invalide.","en":"Invalid amount."},{"id":"must_accept_terms","group":"messages","fr":"Vous devez accepter les conditions générales.","en":"You must accept the terms and conditions."},{"id":"session_expired","group":"messages","fr":"Votre session a expiré. Veuillez vous reconnecter.","en":"Your session has expired. Please log in again."},{"id":"network_error","group":"messages","fr":"Erreur réseau. Veuillez réessayer.","en":"Network error. Please try again."},{"id":"processing","group":"messages","fr":"Traitement en cours...","en":"Processing..."},{"id":"enter_recipient_info","group":"test-env","fr":"Saisissez les informations du destinataire. Vérifiez toujours le numéro avant de valider.","en":"Enter the recipient's information. Always check the number before submitting.","check":true},{"id":"new_beneficiary_warning","group":"test-env","fr":"Ce bénéficiaire n'a jamais été utilisé sur ce compte. Veuillez vérifier le numéro avant de continuer.","en":"This beneficiary has never been used on this account. Please verify the number before proceeding.","check":true,"note":"Mise en garde : vous n’avez jamais envoyé d’argent à cette personne ; vérifiez le numéro. Garder le ton d’avertissement."},{"id":"reason_for_transfer","group":"test-env","fr":"Motif du virement","en":"Reason for transfer","check":true,"note":"Pourquoi vous envoyez l’argent. / Why you are sending the money."},{"id":"note_optional","group":"test-env","fr":"Note (facultatif)","en":"Note (optional)","variants":["Note (facultative)"],"check":true},{"id":"checked_name_number","group":"test-env","fr":"J'ai vérifié le nom et le numéro du bénéficiaire.","en":"I checked the beneficiary's name and number.","check":true,"note":"La personne dit qu’elle a bien vérifié le nom et le numéro."},{"id":"check_info_before_confirm","group":"test-env","fr":"Vérifiez les informations avant de confirmer le virement.","en":"Check the information before confirming the transfer.","check":true},{"id":"phone","group":"test-env","fr":"Téléphone","en":"Phone"},{"id":"operation","group":"test-env","fr":"Opération","en":"Operation"},{"id":"confirm_info_correct","group":"test-env","fr":"Je confirme que les informations ci-dessus sont exactes.","en":"I confirm that the above information is correct.","check":true,"note":"La personne s’engage : les informations sont justes."},{"id":"modify","group":"test-env","fr":"Modifier","en":"Edit","variants":["To modify","Modify"],"check":true},{"id":"transfer_completed","group":"test-env","fr":"Virement effectué","en":"Transfer completed","check":true},{"id":"transfer_sent_success","group":"test-env","fr":"Votre virement a été envoyé avec succès.","en":"Your transfer has been sent successfully.","check":true},{"id":"status_success","group":"test-env","fr":"Succès","en":"Success","variants":["Réussi"]},{"id":"new_transfer","group":"test-env","fr":"Nouveau virement","en":"New transfer","variants":["Nouveau transfert"]},{"id":"services_payment","group":"test-env","fr":"Paiement de services","en":"Payment for services"},{"id":"error","group":"messages","fr":"Erreur","en":"Error"},{"id":"warning","group":"messages","fr":"Attention","en":"Warning"},{"id":"ui_translating","group":"ui","fr":"Traduction en cours…","en":"Translating…"},{"id":"ui_protected","group":"ui","fr":"Valeur protégée, identique à la page","en":"Protected value, same as on the page"},{"id":"ui_validated","group":"ui","fr":"Validé","en":"Validated"},{"id":"ui_auto","group":"ui","fr":"Non validé","en":"Not validated"},{"id":"ui_summary","group":"ui","fr":"Résumé sûr","en":"Safe summary"},{"id":"ui_blocked","group":"ui","fr":"Bloqué : montant différent","en":"Blocked: amount mismatch"},{"id":"ui_missing","group":"ui","fr":"Pas encore traduit","en":"Not translated yet"},{"id":"ui_important","group":"ui","fr":"Messages importants","en":"Important messages"},{"id":"ui_page","group":"ui","fr":"Sur cette page","en":"On this page"},{"id":"ui_new","group":"ui","fr":"NOUVEAU","en":"NEW"},{"id":"ui_listen","group":"ui","fr":"Écouter","en":"Listen"},{"id":"ui_no_audio","group":"ui","fr":"Pas encore d’audio","en":"No audio yet"},{"id":"ui_subtitles","group":"ui","fr":"Sous-titres","en":"Subtitles"},{"id":"ui_close","group":"ui","fr":"Fermer","en":"Close"},{"id":"ui_empty","group":"ui","fr":"Rien à traduire ici","en":"Nothing to translate here"},{"id":"ui_mt_down","group":"ui","fr":"Traduction locale indisponible : résumé utilisé","en":"Local translation unavailable: summary used"},{"id":"ui_hint_hover","group":"ui","fr":"Maintenez Ctrl et pointez un texte : sa traduction s’affiche dessous.","en":"Hold Ctrl and point at any text: its translation appears below."},{"id":"ui_hint_hover_short","group":"ui","fr":"survol = traduction","en":"hover = translation"},{"id":"ui_hint_listen","group":"ui","fr":"Puis appuyez sur Espace pour écouter.","en":"Then press Space to listen."},{"id":"ui_ok","group":"ui","fr":"Compris","en":"Got it"},{"id":"ui_tagline","group":"ui","fr":"Banque en langues nationales","en":"Banking in national languages"},{"id":"ui_active","group":"ui","fr":"Actif sur ce site","en":"Active on this site"},{"id":"ui_unsupported","group":"ui","fr":"Page non prise en charge","en":"Page not supported"},{"id":"ui_reload_msg","group":"ui","fr":"Rechargez la page pour afficher les traductions.","en":"Reload the page to show the translations."},{"id":"ui_reload","group":"ui","fr":"Recharger","en":"Reload"},{"id":"ui_language","group":"ui","fr":"Langue","en":"Language"},{"id":"ui_show","group":"ui","fr":"Afficher la traduction","en":"Show the translation"},{"id":"ui_mode_ctrl","group":"ui","fr":"+ survol","en":"+ hover"},{"id":"ui_mode_hover","group":"ui","fr":"Survol","en":"Hover"},{"id":"ui_mode_off","group":"ui","fr":"Non","en":"Off"},{"id":"ui_panel","group":"ui","fr":"Panneau","en":"Panel"},{"id":"ui_settings","group":"ui","fr":"Glossaire, voix et paramètres","en":"Glossary, voice and settings"},{"id":"ui_choose","group":"ui","fr":"Quelle langue parlez-vous ?","en":"Which language do you speak?"},{"id":"ui_choose_sub","group":"ui","fr":"Langwa affichera la banque dans cette langue.","en":"Langwa will show the bank in this language."},{"id":"ui_soon","group":"ui","fr":"Bientôt","en":"Soon"},{"id":"ui_later","group":"ui","fr":"Plus tard","en":"Later"},{"id":"ui_hint_touch","group":"ui","fr":"Appuyez longuement sur un texte : sa traduction s’affiche dessous.","en":"Long press any text: its translation appears below."},{"id":"ui_hint_touch_short","group":"ui","fr":"appui long = traduction","en":"long press = translation"},{"id":"ui_missing_lang","group":"ui","fr":"Pas encore traduit en {lang}","en":"Not yet translated into {lang}"},{"id":"ui_original","group":"ui","fr":"Original","en":"Original"},{"id":"ui_n_ok","group":"ui","fr":"validées","en":"validated"},{"id":"ui_n_mt","group":"ui","fr":"non validées","en":"not validated"},{"id":"ui_n_gist","group":"ui","fr":"résumés","en":"summaries"},{"id":"ui_n_block","group":"ui","fr":"bloquées","en":"blocked"},{"id":"ui_n_none","group":"ui","fr":"non traduites","en":"not translated"},{"id":"ui_n_ok_one","group":"ui","fr":"validée","en":"validated"},{"id":"ui_n_mt_one","group":"ui","fr":"non validée","en":"not validated"},{"id":"ui_n_gist_one","group":"ui","fr":"résumé","en":"summary"},{"id":"ui_n_block_one","group":"ui","fr":"bloquée","en":"blocked"},{"id":"ui_n_none_one","group":"ui","fr":"non traduite","en":"not translated"},{"id":"ui_voice_human","group":"ui","fr":"Voix humaine","en":"Human voice"},{"id":"ui_voice_neural","group":"ui","fr":"Voix neuronale","en":"Neural voice"},{"id":"ui_voice_synth","group":"ui","fr":"Voix de synthèse","en":"Synthetic voice"},{"id":"ui_voice_local","group":"ui","fr":"Voix locale","en":"Local voice"},{"id":"ui_voice_browser","group":"ui","fr":"Voix du navigateur","en":"Browser voice"},{"id":"ui_voice_preparing","group":"ui","fr":"Voix locale, préparation…","en":"Local voice, preparing…"},{"id":"ui_voice_why_offline","group":"ui","fr":"voix locale éteinte","en":"local voice is off"},{"id":"ui_voice_why_loading","group":"ui","fr":"voix locale en chargement","en":"local voice is loading"},{"id":"ui_voice_why_slow","group":"ui","fr":"voix locale trop lente","en":"local voice too slow"},{"id":"ui_voice_why_error","group":"ui","fr":"voix locale indisponible","en":"local voice unavailable"},{"id":"ui_stop","group":"ui","fr":"Arrêter","en":"Stop"},{"id":"ui_page_mode","group":"ui","fr":"Traduire la page","en":"Translate the page"},{"id":"ui_read_all","group":"ui","fr":"Tout lire","en":"Read all"},{"id":"ui_autoread","group":"ui","fr":"Lecture automatique","en":"Read aloud automatically"},{"id":"ui_autoread_sub","group":"ui","fr":"Lit la traduction dès qu’elle s’affiche","en":"Reads the translation as soon as it appears"},{"id":"ui_space_listen","group":"ui","fr":"écouter","en":"listen"},{"id":"ui_hint_listen_touch","group":"ui","fr":"Touchez Écouter pour entendre la traduction.","en":"Tap Listen to hear the translation."},{"id":"ui_dict_words","group":"ui","fr":"Mots du dictionnaire (non validés)","en":"Dictionary words (not validated)"},{"id":"ui_online_voice","group":"ui","fr":"Voix naturelles en ligne","en":"Natural online voices"},{"id":"ui_online_voice_sub","group":"ui","fr":"Plus fluide. Le texte lu est envoyé à Microsoft ou Google.","en":"More fluent. The text read is sent to Microsoft or Google."},{"id":"ui_online_ask","group":"ui","fr":"Voix plus naturelle ?","en":"A more natural voice?"},{"id":"ui_enable","group":"ui","fr":"Activer","en":"Turn on"},{"id":"ui_no_thanks","group":"ui","fr":"Non merci","en":"No thanks"},{"id":"ui_brand","group":"ui","fr":"Nom propre, non traduit","en":"Proper name, not translated"},{"id":"ui_tab_chat","group":"ui","fr":"Assistant","en":"Ask"},{"id":"ui_tab_msgs","group":"ui","fr":"Messages","en":"Messages"},{"id":"ui_ask_placeholder","group":"ui","fr":"Posez votre question…","en":"Ask your question…"},{"id":"ui_mic","group":"ui","fr":"Parler","en":"Speak"},{"id":"ui_send","group":"ui","fr":"Envoyer","en":"Send"},{"id":"ui_listening","group":"ui","fr":"J’écoute…","en":"Listening…"},{"id":"ui_switch_to","group":"ui","fr":"Passer en {lang}","en":"Switch to {lang}"},{"id":"q_page","group":"ui","fr":"C’est quoi cette page ?","en":"What is this page?"},{"id":"q_amount","group":"ui","fr":"Combien je vais payer ?","en":"How much will I pay?"},{"id":"q_receiver","group":"ui","fr":"Qui reçoit l’argent ?","en":"Who receives the money?"},{"id":"q_warning","group":"ui","fr":"Y a-t-il un danger ?","en":"Is there any danger?"},{"id":"q_next","group":"ui","fr":"Je fais quoi maintenant ?","en":"What do I do now?"},{"id":"ans_welcome","group":"ui","fr":"Bonjour ! Posez-moi une question sur cette page, en écrivant ou à voix haute.","en":"Hello! Ask me a question about this page, by typing or out loud."},{"id":"ans_page","group":"ui","fr":"Cette page : {title}.","en":"This page: {title}."},{"id":"ans_amount","group":"ui","fr":"Montant total : {total}.","en":"Total amount: {total}."},{"id":"ans_fees","group":"ui","fr":"Frais : {fees}.","en":"Fees: {fees}."},{"id":"ans_no_amount","group":"ui","fr":"Je ne vois pas de montant sur cette page.","en":"I do not see an amount on this page."},{"id":"ans_receiver","group":"ui","fr":"L’argent va à {name}.","en":"The money goes to {name}."},{"id":"ans_no_receiver","group":"ui","fr":"Je ne vois pas encore de bénéficiaire sur cette page.","en":"I do not see a beneficiary on this page yet."},{"id":"ans_warning","group":"ui","fr":"Attention : {message}","en":"Warning: {message}"},{"id":"ans_no_warning","group":"ui","fr":"Pas d’alerte sur cette page.","en":"No warning on this page."},{"id":"ans_next","group":"ui","fr":"Ensuite, appuyez sur {button}.","en":"Next, press {button}."},{"id":"ans_no_next","group":"ui","fr":"Je ne vois pas de bouton à appuyer.","en":"I do not see a button to press."},{"id":"ans_balance","group":"ui","fr":"Argent disponible : {balance}.","en":"Money available: {balance}."},{"id":"ans_unknown","group":"ui","fr":"Je peux répondre à ces questions :","en":"I can answer these questions:"},{"id":"ans_type_instead","group":"ui","fr":"Écrivez votre question ou touchez une question ci-dessous.","en":"Type your question or tap a question below."},{"id":"ans_lang_detected","group":"ui","fr":"Vous parlez {lang} ?","en":"Are you speaking {lang}?"},{"id":"ans_speech_consent","group":"ui","fr":"Pour comprendre votre voix, le navigateur envoie l’enregistrement au service de reconnaissance de Google (français, anglais, pidgin).","en":"To understand your voice, the browser sends the recording to Google’s speech service (French, English, Pidgin)."},{"id":"ans_model_note","group":"ui","fr":"Réponse d’un modèle local, à vérifier.","en":"Answer from a local model: please check."}]},"langs":{"ewo":{"name":"Ewondo","region":"Centre","nllb":null,"mms":null,"refs":[{"name":"Wiktionnaire (éwondo)","url":"https://fr.wiktionary.org/wiki/Cat%C3%A9gorie:%C3%A9wondo"},{"name":"Wiktionary (Ewondo)","url":"https://en.wiktionary.org/wiki/Category:Ewondo_lemmas"}],"africaTts":"ewo"},"fub":{"name":"Fulfulde","region":"Adamaoua, Nord, Extrême-Nord","nllb":"fuv_Latn","mms":"ful","refs":[{"name":"Wiktionnaire (peul)","url":"https://fr.wiktionary.org/wiki/Cat%C3%A9gorie:peul"},{"name":"Wiktionary (Fula)","url":"https://en.wiktionary.org/wiki/Category:Fula_lemmas"}],"africaTts":"fub"},"wes":{"name":"Pidgin (Kamtok)","region":"Nord-Ouest, Sud-Ouest, Littoral, grandes villes","nllb":null,"mms":null,"voices":["en-NG","en-CM","en-GH","en-ZA","en"],"reading":"none","refs":[{"name":"Wikipedia: Cameroonian Pidgin","url":"https://en.wikipedia.org/wiki/Cameroonian_Pidgin_English"}],"africaTts":"eng"},"dua":{"name":"Duala","region":"Littoral","nllb":null,"mms":null,"refs":[{"name":"Wiktionnaire (douala)","url":"https://fr.wiktionary.org/wiki/Cat%C3%A9gorie:douala"},{"name":"Wiktionary (Duala)","url":"https://en.wiktionary.org/wiki/Category:Duala_lemmas"}],"africaTts":"dua"},"bbj":{"name":"Ghomálá'","region":"Ouest","nllb":null,"mms":null,"refs":[{"name":"Wiktionary (Ghomala')","url":"https://en.wiktionary.org/wiki/Category:Ghomala%27_lemmas"}],"africaTts":"bbj"},"bas":{"name":"Basaá","region":"Centre, Littoral","nllb":null,"mms":null,"refs":[{"name":"Wiktionnaire (bassa)","url":"https://fr.wiktionary.org/wiki/Cat%C3%A9gorie:bassa_(Cameroun)"},{"name":"Wiktionary (Basaa)","url":"https://en.wiktionary.org/wiki/Category:Basaa_lemmas"}],"africaTts":"bas"},"nge":{"name":"Mankon (Ngemba)","region":"Nord-Ouest (Bamenda)","nllb":null,"mms":null,"refs":[{"name":"Mankon Dictionary","url":"https://mankon-dictionary.vercel.app/"}],"africaTts":"nge"},"bkm":{"name":"Kom","region":"Nord-Ouest (Boyo)","nllb":null,"mms":null,"refs":[{"name":"Kom writing system (Omniglot)","url":"https://omniglot.com/writing/kom.htm"},{"name":"Wiktionary (Kom)","url":"https://en.wiktionary.org/wiki/Category:Kom_(Cameroon)_lemmas"}],"africaTts":"bkm"}},"packs":{"ewo":{"code":"ewo","validation":{"validators":[],"method":"Native-speaker review in the glossary editor (options page). Each entry stores who validated it."},"entries":{}},"fub":{"code":"fub","validation":{"validators":[],"status":"DRAFT. Written with AI assistance (Claude) from general Fula knowledge and Wiktionnaire terms. NOT validated by a native speaker: every entry is shown to users as 'Non validé'. To be reviewed by Adamawa Fulfulde speakers through the contribution page and the glossary editor.","method":"Native-speaker review in the glossary editor (options page). Each entry stores who validated it."},"entries":{"gist_error":{"t":"Ɗum ko kabaaru juumre. Golle ɗee ngasaaki.","by":"Brouillon IA, à valider"},"gist_warning":{"t":"Reentino : jangu no feewi, maa naamno goɗɗo mo a hoolii.","by":"Brouillon IA, à valider"},"gist_success":{"t":"Golle ɗee ngasii.","by":"Brouillon IA, à valider"},"gist_info":{"t":"Kabaaru.","by":"Brouillon IA, à valider"},"gist_keywords":{"t":"Konguɗi :","by":"Brouillon IA, à valider"},"test_banner":{"t":"Nokku ƴeewndagol : ceede ɗee goongaaka, neldugo goonga walaa.","by":"Brouillon IA, à valider"},"test_protocol":{"t":"Laawol ƴeewndagol","by":"Brouillon IA, à valider"},"back_hackathon":{"t":"Rutto to hackathon","by":"Brouillon IA, à valider"},"online_banking":{"t":"Banke e internet","by":"Brouillon IA, à valider"},"step_pay":{"t":"Yoɓugo","by":"Brouillon IA, à valider"},"step_costs":{"t":"Njoɓdi","by":"Brouillon IA, à valider"},"step_beneficiary":{"t":"Jaɓoowo","by":"Brouillon IA, à valider"},"step_summary":{"t":"Ƴeewndol","by":"Brouillon IA, à valider"},"step_confirmation":{"t":"Tabbitingol","by":"Brouillon IA, à valider"},"your_account":{"t":"Konte maa","by":"Brouillon IA, à valider"},"hello_name":{"t":"Jam waali, {name}","by":"Brouillon IA, à valider"},"intro_balance":{"t":"Ndaar ceede maa, nde neldaa ceede e kisal.","by":"Brouillon IA, à valider"},"available_balance":{"t":"Ceede ɗe a waawi huutorgo","by":"Brouillon IA, à valider"},"balance":{"t":"Ceede maa","by":"Brouillon IA, à valider"},"account_number":{"t":"Limre konte","by":"Brouillon IA, à valider"},"current_account":{"t":"Konte nyalaade fuu","by":"Brouillon IA, à valider"},"perform_transfer":{"t":"Nelda ceede","by":"Brouillon IA, à valider"},"view_fees":{"t":"Ndaar njoɓdi","by":"Brouillon IA, à valider"},"recent_transactions":{"t":"Golle sakkitiiɗe","by":"Brouillon IA, à valider"},"merchant_payment":{"t":"Njoɓdi to jeeyoowo","by":"Brouillon IA, à valider"},"salary_received":{"t":"Ceede golle ngarii","by":"Brouillon IA, à valider"},"transfer_received":{"t":"Ceede neldaaɗe ngarii","by":"Brouillon IA, à valider"},"electricity_bill":{"t":"Njoɓdi kuuraŋ","by":"Brouillon IA, à valider"},"security":{"t":"Kisal","by":"Brouillon IA, à valider"},"security_check_beneficiary":{"t":"Ndaar innde e limre jaɓoowo saa'i fuu, hade a tabbitina neldugo.","by":"Brouillon IA, à valider"},"secure_connection":{"t":"Jokkondiral kisal","by":"Brouillon IA, à valider"},"demo_footer":{"t":"Safinum Pay : nokku ƴeewndagol. Taa winndu kabaruuji maa goonga.","by":"Brouillon IA, à valider"},"never_share_pin":{"t":"Taa hokku goɗɗo code PIN maa, hay goɗɗo banke.","by":"Brouillon IA, à valider"},"irreversible":{"t":"Si a tabbitinii, neldugo ngo waawaa firtaade.","by":"Brouillon IA, à valider"},"transfer_fees":{"t":"Njoɓdi neldugo","by":"Brouillon IA, à valider"},"fees":{"t":"Njoɓdi","by":"Brouillon IA, à valider"},"choose_type_amount":{"t":"Suɓo no neldirta e ceede ɗe neldataa. Njoɓdi hiisoto e hoore mum.","by":"Brouillon IA, à valider"},"operation_type":{"t":"No golle ngonri","by":"Brouillon IA, à valider"},"safinum_account":{"t":"Konte Safinum","by":"Brouillon IA, à valider"},"instant_free":{"t":"Neldugo jaawngo, njoɓdi walaa","by":"Brouillon IA, à valider"},"amount_to_send":{"t":"Ceede ɗe neldataa","by":"Brouillon IA, à valider"},"amount":{"t":"Ceede","by":"Brouillon IA, à valider"},"free":{"t":"Njoɓdi walaa","by":"Brouillon IA, à valider"},"total_debited":{"t":"Ceede fuu ɗe njaltata e konte maa","by":"Brouillon IA, à valider"},"balance_after":{"t":"Ceede keddotooɗe caggal neldugo","by":"Brouillon IA, à valider"},"beneficiary":{"t":"Jaɓoowo","by":"Brouillon IA, à valider"},"beneficiary_name":{"t":"Innde jaɓoowo","by":"Brouillon IA, à valider"},"phone_number":{"t":"Limre telefon","by":"Brouillon IA, à valider"},"phone":{"t":"Telefon","by":"Brouillon IA, à valider"},"reason_for_transfer":{"t":"Sabaabu neldugo","by":"Brouillon IA, à valider"},"note_optional":{"t":"Binndol (si a yiɗii)","by":"Brouillon IA, à valider"},"enter_recipient_info":{"t":"Winndu kabaruuji jaɓoowo. Ndaar limre ndee saa'i fuu hade a nelda.","by":"Brouillon IA, à valider"},"new_beneficiary_warning":{"t":"A neldaayno ceede e jaɓoowo oo e konte maa fay. Useko, ndaar limre makko hade a jokka.","by":"Brouillon IA, à valider"},"checked_name_number":{"t":"Mi ndaarii innde e limre jaɓoowo.","by":"Brouillon IA, à valider"},"check_info_before_confirm":{"t":"Ndaar kabaruuji ɗii hade a tabbitina neldugo.","by":"Brouillon IA, à valider"},"send_amount_to":{"t":"A neldata {amount} e {name}.","by":"Brouillon IA, à valider"},"reference":{"t":"Limre golle","by":"Brouillon IA, à valider"},"operation":{"t":"Golle","by":"Brouillon IA, à valider"},"confirm_info_correct":{"t":"Mi tabbitinii kabaruuji ɗii ngoongaaji.","by":"Brouillon IA, à valider"},"modify":{"t":"Waylu","by":"Brouillon IA, à valider"},"confirm_transfer":{"t":"Tabbitin neldugo","by":"Brouillon IA, à valider"},"confirm":{"t":"Tabbitin","by":"Brouillon IA, à valider"},"cancel":{"t":"Haɗu","by":"Brouillon IA, à valider"},"back":{"t":"Rutto","by":"Brouillon IA, à valider"},"continue":{"t":"Jokku","by":"Brouillon IA, à valider"},"transfer_completed":{"t":"Neldugo gasii","by":"Brouillon IA, à valider"},"transfer_sent_success":{"t":"Ceede maa neldaama no woodi.","by":"Brouillon IA, à valider"},"status":{"t":"No ngonri","by":"Brouillon IA, à valider"},"status_success":{"t":"Gasii","by":"Brouillon IA, à valider"},"new_transfer":{"t":"Neldugo kesum","by":"Brouillon IA, à valider"},"insufficient_balance":{"t":"Ceede maa njonaa ngam golle ɗee.","by":"Brouillon IA, à valider"},"pin_incorrect_attempts":{"t":"Code PIN boni. Ko keddi ma etaaje {count}.","by":"Brouillon IA, à valider"},"pin_incorrect":{"t":"Code PIN boni.","by":"Brouillon IA, à valider"},"error":{"t":"Juumre","by":"Brouillon IA, à valider"},"warning":{"t":"Reentino","by":"Brouillon IA, à valider"},"ui_tab_chat":{"t":"Naamno","by":"Brouillon IA, à valider"},"ui_tab_msgs":{"t":"Kabaruuji","by":"Brouillon IA, à valider"},"ui_ask_placeholder":{"t":"Naamno naamne maa…","by":"Brouillon IA, à valider"},"ui_mic":{"t":"Haal","by":"Brouillon IA, à valider"},"ui_send":{"t":"Nelda","by":"Brouillon IA, à valider"},"ui_listening":{"t":"Mi heɗii…","by":"Brouillon IA, à valider"},"ui_switch_to":{"t":"Waylu e {lang}","by":"Brouillon IA, à valider"},"q_page":{"t":"Ɗoo ko honɗum?","by":"Brouillon IA, à valider"},"q_amount":{"t":"Ceede no foti mi yoɓata?","by":"Brouillon IA, à valider"},"q_receiver":{"t":"Moye jaɓata ceede ɗee?","by":"Brouillon IA, à valider"},"q_warning":{"t":"Reentino woodi na?","by":"Brouillon IA, à valider"},"q_next":{"t":"Ko mi waɗata jooni?","by":"Brouillon IA, à valider"},"ans_welcome":{"t":"Jam waali! Naamno mi ko faati e ngol hello, winndu maa haal.","by":"Brouillon IA, à valider"},"ans_page":{"t":"Ɗoo ko: {title}.","by":"Brouillon IA, à valider"},"ans_amount":{"t":"Ceede fuu ɗe njaltata: {total}.","by":"Brouillon IA, à valider"},"ans_fees":{"t":"Njoɓdi: {fees}.","by":"Brouillon IA, à valider"},"ans_no_amount":{"t":"Mi yi’aali ceede e ngol hello.","by":"Brouillon IA, à valider"},"ans_receiver":{"t":"Ceede ɗee njahan to {name}.","by":"Brouillon IA, à valider"},"ans_no_receiver":{"t":"Mi yi’aali jaɓoowo e ngol hello taho.","by":"Brouillon IA, à valider"},"ans_warning":{"t":"Reentino: {message}","by":"Brouillon IA, à valider"},"ans_no_warning":{"t":"Reentino walaa e ngol hello.","by":"Brouillon IA, à valider"},"ans_next":{"t":"Jooni, ñoƴƴu {button}.","by":"Brouillon IA, à valider"},"ans_no_next":{"t":"Mi yi’aali butoŋ.","by":"Brouillon IA, à valider"},"ans_balance":{"t":"Ceede ɗe a waawi huutorgo: {balance}.","by":"Brouillon IA, à valider"},"ans_unknown":{"t":"Mi waawi jaabaade ɗee naamne:","by":"Brouillon IA, à valider"},"ans_type_instead":{"t":"Winndu naamne maa maa suɓo naamne les.","by":"Brouillon IA, à valider"},"ans_lang_detected":{"t":"A haalata {lang}?","by":"Brouillon IA, à valider"},"ans_speech_consent":{"t":"Ngam faamde hoolo maa, browser oo nelday ɗum to Google (Farayse, Engeleere, Pidgin).","by":"Brouillon IA, à valider"},"ans_model_note":{"t":"Jaabawol ordinater: ndaar ɗum.","by":"Brouillon IA, à valider"}}},"wes":{"code":"wes","validation":{"validators":[],"status":"DRAFT. Cameroonian Pidgin English (Kamtok), written with AI assistance (Claude) in the English-based spelling common on WhatsApp. NOT validated by a native speaker: every entry is shown to users as 'Non validé' until a Cameroonian Pidgin speaker reviews it.","method":"Native-speaker review in the glossary editor (options page). Each entry stores who validated it."},"entries":{"gist_error":{"t":"Na error message dis. The thing no pass.","by":"Brouillon IA, à valider"},"gist_warning":{"t":"Warning for security: read am well well, or ask person wey you trust make e help you.","by":"Brouillon IA, à valider"},"gist_success":{"t":"The thing don pass fine.","by":"Brouillon IA, à valider"},"gist_info":{"t":"Na information message.","by":"Brouillon IA, à valider"},"gist_keywords":{"t":"Important words:","by":"Brouillon IA, à valider"},"test_banner":{"t":"Na test environment: all the data na fake, no real money di move.","by":"Brouillon IA, à valider"},"test_protocol":{"t":"How for do the test","by":"Brouillon IA, à valider"},"back_hackathon":{"t":"Go back for hackathon","by":"Brouillon IA, à valider"},"online_banking":{"t":"Bank for internet","by":"Brouillon IA, à valider"},"step_pay":{"t":"Pay","by":"Brouillon IA, à valider"},"step_costs":{"t":"Charges","by":"Brouillon IA, à valider"},"step_beneficiary":{"t":"Person wey go receive","by":"Brouillon IA, à valider"},"step_summary":{"t":"Summary","by":"Brouillon IA, à valider"},"step_confirmation":{"t":"Confirm","by":"Brouillon IA, à valider"},"your_account":{"t":"Your account","by":"Brouillon IA, à valider"},"hello_name":{"t":"Hello, {name}","by":"Brouillon IA, à valider"},"intro_balance":{"t":"Check how much money you get, and send money with security.","by":"Brouillon IA, à valider"},"available_balance":{"t":"Money wey you fit use now","by":"Brouillon IA, à valider"},"balance":{"t":"Money wey dey your account","by":"Brouillon IA, à valider"},"account_number":{"t":"Account number","by":"Brouillon IA, à valider"},"current_account":{"t":"Account for everyday","by":"Brouillon IA, à valider"},"savings_account":{"t":"Account for save money","by":"Brouillon IA, à valider"},"perform_transfer":{"t":"Send money","by":"Brouillon IA, à valider"},"view_fees":{"t":"Look the charges","by":"Brouillon IA, à valider"},"recent_transactions":{"t":"Last things wey you do for your account","by":"Brouillon IA, à valider"},"merchant_payment":{"t":"Money wey you pay for shop","by":"Brouillon IA, à valider"},"salary_received":{"t":"Salary don enter","by":"Brouillon IA, à valider"},"transfer_received":{"t":"Money wey person send you don enter","by":"Brouillon IA, à valider"},"transfer_sent":{"t":"Money wey you send","by":"Brouillon IA, à valider"},"electricity_bill":{"t":"Light bill","by":"Brouillon IA, à valider"},"water_bill":{"t":"Water bill","by":"Brouillon IA, à valider"},"cash_withdrawal":{"t":"Money wey you comot","by":"Brouillon IA, à valider"},"deposit":{"t":"Money wey you put inside","by":"Brouillon IA, à valider"},"airtime":{"t":"Buy credit","by":"Brouillon IA, à valider"},"security":{"t":"Security","by":"Brouillon IA, à valider"},"security_check_beneficiary":{"t":"Always check the name and number of the person wey go receive, before you confirm the transfer.","by":"Brouillon IA, à valider"},"secure_connection":{"t":"Connection wey get security","by":"Brouillon IA, à valider"},"demo_footer":{"t":"Safinum Pay: na test environment. No put your real personal information.","by":"Brouillon IA, à valider"},"never_share_pin":{"t":"No ever give your PIN to anybody, even person wey work for bank.","by":"Brouillon IA, à valider"},"fraud_warning":{"t":"Watch out for call or SMS wey di ask your secret code.","by":"Brouillon IA, à valider"},"irreversible":{"t":"When you don confirm, you no fit cancel the transfer again.","by":"Brouillon IA, à valider"},"check_details":{"t":"Check all the information before you confirm.","by":"Brouillon IA, à valider"},"transfer_fees":{"t":"Charges for send money","by":"Brouillon IA, à valider"},"transaction_fees":{"t":"Charges for the transaction","by":"Brouillon IA, à valider"},"fees":{"t":"Charges","by":"Brouillon IA, à valider"},"choose_type_amount":{"t":"Choose how you want send and how much. The charges go calculate by themself.","by":"Brouillon IA, à valider"},"operation_type":{"t":"Which kind operation","by":"Brouillon IA, à valider"},"safinum_account":{"t":"Safinum account","by":"Brouillon IA, à valider"},"instant_free":{"t":"The money go reach quick quick, and e free","by":"Brouillon IA, à valider"},"other_bank":{"t":"Account for another bank","by":"Brouillon IA, à valider"},"mobile_money":{"t":"Mobile Money","by":"Brouillon IA, à valider"},"amount_to_send":{"t":"How much you want send","by":"Brouillon IA, à valider"},"amount":{"t":"How much","by":"Brouillon IA, à valider"},"free":{"t":"Free","by":"Brouillon IA, à valider"},"total_debited":{"t":"All the money wey go comot for your account","by":"Brouillon IA, à valider"},"balance_after":{"t":"Money wey go remain after","by":"Brouillon IA, à valider"},"fee_rate_min":{"t":"{rate} of the money (at least {min})","by":"Brouillon IA, à valider"},"beneficiary":{"t":"Person wey go receive","by":"Brouillon IA, à valider"},"beneficiary_name":{"t":"Name of the person wey go receive","by":"Brouillon IA, à valider"},"phone_number":{"t":"Phone number","by":"Brouillon IA, à valider"},"account_or_phone":{"t":"Account number or phone number","by":"Brouillon IA, à valider"},"reason":{"t":"Why you di send","by":"Brouillon IA, à valider"},"transfer_summary":{"t":"Summary of the transfer","by":"Brouillon IA, à valider"},"send_amount_to":{"t":"You di go send {amount} give {name}.","by":"Brouillon IA, à valider"},"pin_code":{"t":"PIN code","by":"Brouillon IA, à valider"},"enter_pin":{"t":"Put your PIN","by":"Brouillon IA, à valider"},"accept_terms":{"t":"I agree with the conditions.","by":"Brouillon IA, à valider"},"terms":{"t":"Conditions","by":"Brouillon IA, à valider"},"back":{"t":"Go back","by":"Brouillon IA, à valider"},"continue":{"t":"Continue","by":"Brouillon IA, à valider"},"confirm":{"t":"Confirm","by":"Brouillon IA, à valider"},"confirm_transfer":{"t":"Confirm the transfer","by":"Brouillon IA, à valider"},"cancel":{"t":"Cancel","by":"Brouillon IA, à valider"},"reference":{"t":"Reference","by":"Brouillon IA, à valider"},"date":{"t":"Date","by":"Brouillon IA, à valider"},"status":{"t":"How e be","by":"Brouillon IA, à valider"},"transfer_success":{"t":"The transfer don pass fine.","by":"Brouillon IA, à valider"},"insufficient_balance":{"t":"Your money no reach for do this operation.","by":"Brouillon IA, à valider"},"pin_incorrect_attempts":{"t":"PIN no correct. You remain {count} try.","by":"Brouillon IA, à valider"},"pin_incorrect":{"t":"PIN no correct.","by":"Brouillon IA, à valider"},"account_locked":{"t":"Dem don block your account for small time.","by":"Brouillon IA, à valider"},"required_field":{"t":"You must fill this place.","by":"Brouillon IA, à valider"},"invalid_amount":{"t":"This amount no correct.","by":"Brouillon IA, à valider"},"must_accept_terms":{"t":"You must agree with the conditions.","by":"Brouillon IA, à valider"},"session_expired":{"t":"Your time don finish. Log in again.","by":"Brouillon IA, à valider"},"network_error":{"t":"Network get problem. Try again.","by":"Brouillon IA, à valider"},"processing":{"t":"E di work...","by":"Brouillon IA, à valider"},"enter_recipient_info":{"t":"Put the information of the person wey go receive. Always check the number before you send.","by":"Brouillon IA, à valider"},"new_beneficiary_warning":{"t":"You never send money give this person from this account before. Abeg check the number well before you continue.","by":"Brouillon IA, à valider"},"reason_for_transfer":{"t":"Why you di send the money","by":"Brouillon IA, à valider"},"note_optional":{"t":"Small note (if you want)","by":"Brouillon IA, à valider"},"checked_name_number":{"t":"I don check the name and number of the person wey go receive.","by":"Brouillon IA, à valider"},"check_info_before_confirm":{"t":"Check the information before you confirm the transfer.","by":"Brouillon IA, à valider"},"phone":{"t":"Phone","by":"Brouillon IA, à valider"},"operation":{"t":"Operation","by":"Brouillon IA, à valider"},"confirm_info_correct":{"t":"I confirm say all the information for up na correct.","by":"Brouillon IA, à valider"},"modify":{"t":"Change am","by":"Brouillon IA, à valider"},"transfer_completed":{"t":"Transfer don finish","by":"Brouillon IA, à valider"},"transfer_sent_success":{"t":"Your money don go fine.","by":"Brouillon IA, à valider"},"status_success":{"t":"E don pass","by":"Brouillon IA, à valider"},"new_transfer":{"t":"New transfer","by":"Brouillon IA, à valider"},"services_payment":{"t":"Pay for service","by":"Brouillon IA, à valider"},"error":{"t":"Error","by":"Brouillon IA, à valider"},"warning":{"t":"Warning","by":"Brouillon IA, à valider"},"ui_translating":{"t":"E di translate…","by":"Brouillon IA, à valider"},"ui_protected":{"t":"Protected, e be same as for the page","by":"Brouillon IA, à valider"},"ui_validated":{"t":"Checked","by":"Brouillon IA, à valider"},"ui_auto":{"t":"No check yet","by":"Brouillon IA, à valider"},"ui_summary":{"t":"Safe summary","by":"Brouillon IA, à valider"},"ui_blocked":{"t":"Blocked: the money no match","by":"Brouillon IA, à valider"},"ui_missing":{"t":"No translate yet","by":"Brouillon IA, à valider"},"ui_important":{"t":"Important messages","by":"Brouillon IA, à valider"},"ui_page":{"t":"For this page","by":"Brouillon IA, à valider"},"ui_new":{"t":"NEW","by":"Brouillon IA, à valider"},"ui_listen":{"t":"Hear am","by":"Brouillon IA, à valider"},"ui_no_audio":{"t":"No voice yet","by":"Brouillon IA, à valider"},"ui_subtitles":{"t":"Subtitles","by":"Brouillon IA, à valider"},"ui_close":{"t":"Close","by":"Brouillon IA, à valider"},"ui_empty":{"t":"Nothing for translate here","by":"Brouillon IA, à valider"},"ui_mt_down":{"t":"Computer translation no dey: na summary we use","by":"Brouillon IA, à valider"},"ui_hint_hover":{"t":"Hold Ctrl and point any word: the translation go show for under.","by":"Brouillon IA, à valider"},"ui_hint_hover_short":{"t":"point = translation","by":"Brouillon IA, à valider"},"ui_hint_listen":{"t":"Then press Space for hear am.","by":"Brouillon IA, à valider"},"ui_ok":{"t":"I don understand","by":"Brouillon IA, à valider"},"ui_tagline":{"t":"Bank for we own language","by":"Brouillon IA, à valider"},"ui_active":{"t":"E dey work for this site","by":"Brouillon IA, à valider"},"ui_unsupported":{"t":"E no fit work for this page","by":"Brouillon IA, à valider"},"ui_reload_msg":{"t":"Reload the page make the translation show.","by":"Brouillon IA, à valider"},"ui_reload":{"t":"Reload","by":"Brouillon IA, à valider"},"ui_language":{"t":"Language","by":"Brouillon IA, à valider"},"ui_show":{"t":"Show the translation","by":"Brouillon IA, à valider"},"ui_mode_ctrl":{"t":"+ point","by":"Brouillon IA, à valider"},"ui_mode_hover":{"t":"Point","by":"Brouillon IA, à valider"},"ui_mode_off":{"t":"Off","by":"Brouillon IA, à valider"},"ui_panel":{"t":"Panel","by":"Brouillon IA, à valider"},"ui_settings":{"t":"Words, voice and settings","by":"Brouillon IA, à valider"},"ui_choose":{"t":"Which language you di talk?","by":"Brouillon IA, à valider"},"ui_choose_sub":{"t":"Langwa go show the bank for this language.","by":"Brouillon IA, à valider"},"ui_soon":{"t":"E di come","by":"Brouillon IA, à valider"},"ui_later":{"t":"After","by":"Brouillon IA, à valider"},"ui_hint_touch":{"t":"Press any word for long: the translation go show for under.","by":"Brouillon IA, à valider"},"ui_hint_touch_short":{"t":"press long = translation","by":"Brouillon IA, à valider"},"ui_missing_lang":{"t":"Dem never translate am for {lang}","by":"Brouillon IA, à valider"},"ui_original":{"t":"Original","by":"Brouillon IA, à valider"},"ui_n_ok":{"t":"checked","by":"Brouillon IA, à valider"},"ui_n_mt":{"t":"no check yet","by":"Brouillon IA, à valider"},"ui_n_gist":{"t":"summaries","by":"Brouillon IA, à valider"},"ui_n_block":{"t":"blocked","by":"Brouillon IA, à valider"},"ui_n_none":{"t":"no translate yet","by":"Brouillon IA, à valider"},"ui_n_ok_one":{"t":"checked","by":"Brouillon IA, à valider"},"ui_n_mt_one":{"t":"no check yet","by":"Brouillon IA, à valider"},"ui_n_gist_one":{"t":"summary","by":"Brouillon IA, à valider"},"ui_n_block_one":{"t":"blocked","by":"Brouillon IA, à valider"},"ui_n_none_one":{"t":"no translate yet","by":"Brouillon IA, à valider"},"ui_voice_human":{"t":"Real person voice","by":"Brouillon IA, à valider"},"ui_voice_neural":{"t":"Computer voice (neural)","by":"Brouillon IA, à valider"},"ui_voice_synth":{"t":"Computer voice","by":"Brouillon IA, à valider"},"ui_stop":{"t":"Stop","by":"Brouillon IA, à valider"},"ui_page_mode":{"t":"Translate the page","by":"Brouillon IA, à valider"},"ui_read_all":{"t":"Read everything","by":"Brouillon IA, à valider"},"ui_autoread":{"t":"Read by itself","by":"Brouillon IA, à valider"},"ui_autoread_sub":{"t":"E go read the translation as e show","by":"Brouillon IA, à valider"},"ui_space_listen":{"t":"hear","by":"Brouillon IA, à valider"},"ui_hint_listen_touch":{"t":"Touch Hear am for hear the translation.","by":"Brouillon IA, à valider"},"ui_dict_words":{"t":"Words from dictionary (no check yet)","by":"Brouillon IA, à valider"},"ui_online_voice":{"t":"Natural voice for internet","by":"Brouillon IA, à valider"},"ui_online_voice_sub":{"t":"E sweet pass. The text go go Microsoft or Google.","by":"Brouillon IA, à valider"},"ui_online_ask":{"t":"You want voice wey sweet pass?","by":"Brouillon IA, à valider"},"ui_enable":{"t":"Put am on","by":"Brouillon IA, à valider"},"ui_no_thanks":{"t":"No, thank you","by":"Brouillon IA, à valider"},"ui_brand":{"t":"Na name, we no translate am","by":"Brouillon IA, à valider"},"ui_tab_chat":{"t":"Ask","by":"Brouillon IA, à valider"},"ui_tab_msgs":{"t":"Messages","by":"Brouillon IA, à valider"},"ui_ask_placeholder":{"t":"Ask your question…","by":"Brouillon IA, à valider"},"ui_mic":{"t":"Talk","by":"Brouillon IA, à valider"},"ui_send":{"t":"Send","by":"Brouillon IA, à valider"},"ui_listening":{"t":"I di listen…","by":"Brouillon IA, à valider"},"ui_switch_to":{"t":"Change to {lang}","by":"Brouillon IA, à valider"},"q_page":{"t":"Wetin dis page be?","by":"Brouillon IA, à valider"},"q_amount":{"t":"How much I go pay?","by":"Brouillon IA, à valider"},"q_receiver":{"t":"Who go receive the money?","by":"Brouillon IA, à valider"},"q_warning":{"t":"Any danger for here?","by":"Brouillon IA, à valider"},"q_next":{"t":"Wetin I go do now?","by":"Brouillon IA, à valider"},"ans_welcome":{"t":"Hello! Ask me anything about dis page, write am or talk am.","by":"Brouillon IA, à valider"},"ans_page":{"t":"Dis page na: {title}.","by":"Brouillon IA, à valider"},"ans_amount":{"t":"All the money wey go comot: {total}.","by":"Brouillon IA, à valider"},"ans_fees":{"t":"Charges: {fees}.","by":"Brouillon IA, à valider"},"ans_no_amount":{"t":"I no see any amount for dis page.","by":"Brouillon IA, à valider"},"ans_receiver":{"t":"The money go go give {name}.","by":"Brouillon IA, à valider"},"ans_no_receiver":{"t":"I never see the person wey go receive for dis page.","by":"Brouillon IA, à valider"},"ans_warning":{"t":"Take care: {message}","by":"Brouillon IA, à valider"},"ans_no_warning":{"t":"No warning for dis page.","by":"Brouillon IA, à valider"},"ans_next":{"t":"Now, press {button}.","by":"Brouillon IA, à valider"},"ans_no_next":{"t":"I no see any button for press.","by":"Brouillon IA, à valider"},"ans_balance":{"t":"Money wey you fit use: {balance}.","by":"Brouillon IA, à valider"},"ans_unknown":{"t":"I fit answer these questions:","by":"Brouillon IA, à valider"},"ans_type_instead":{"t":"Write your question or touch one question for down.","by":"Brouillon IA, à valider"},"ans_lang_detected":{"t":"You di talk {lang}?","by":"Brouillon IA, à valider"},"ans_speech_consent":{"t":"For understand your voice, the browser go send the recording give Google (French, English, Pidgin).","by":"Brouillon IA, à valider"},"ans_model_note":{"t":"Na computer answer: check am well.","by":"Brouillon IA, à valider"}}},"dua":{"code":"dua","validation":{"validators":[],"method":"Native-speaker review in the glossary editor (options page). Each entry stores who validated it."},"entries":{}},"bbj":{"code":"bbj","validation":{"validators":[],"method":"Native-speaker review in the glossary editor (options page). Each entry stores who validated it."},"entries":{}},"bas":{"code":"bas","validation":{"validators":[],"method":"Native-speaker review in the glossary editor (options page). Each entry stores who validated it."},"entries":{}},"nge":{"code":"nge","validation":{"validators":[],"method":"Native-speaker review in the glossary editor (options page). Each entry stores who validated it."},"entries":{}},"bkm":{"code":"bkm","validation":{"validators":[],"method":"Native-speaker review in the glossary editor (options page). Each entry stores who validated it."},"entries":{}}},"lexicon":{"licence":"Words from Wiktionnaire / Wiktionary contributors, CC BY-SA 4.0 (https://fr.wiktionary.org, https://en.wiktionary.org). Dictionary hints, not validated.","fr":{"ewo":{"eau":["məndím"],"bonjour":["bembekiri"]},"fub":{"non":["ala"],"merci":["adjarama","tiyaabu"],"savoir":["annduude"],"connaitre":["annduude"],"aide":["ballal"],"travail":["ballal"],"eau":["ceeɗoojam","ndiyam","ndiiam"],"voleur":["gujjo"],"personne":["goɗɗo"],"mois":["lewru"]},"dua":{"acheter":["anda"],"savoir":["bía"],"vendre":["andisɛ"],"jour":["búńa"],"changer":["cenci","tukwa"],"travail":["ebolo"],"accepter":["koa"],"lire":["lánga"],"prendre":["lámba ńolo","no̱ngo̱ jangame̱n"],"dire":["kwála"],"lettre":["kálati"],"eau":["madíbá"],"personne":["moto"],"garder":["táta"],"payer":["sáwa"],"ouvrir":["télɛ"]},"bas":{"changer":["hɛ̀ŋlà"],"eau":["malép","màlep","màlep ma ɓâs"]},"bbj":{},"nge":{"eau":["ŋkyi"]},"bkm":{"eau":["mu"]}},"en":{"ewo":{"water":["məndím"]},"fub":{"never":["abada","abadan","muk"],"no":["alaa","aldaa","walaa"],"person":["aaden","gimɗo","neɗɗo"],"total":["adadu","kawral"],"number":["adadu"],"before":["adaade"],"take":["addugol","laatagol","naɓugol"],"know":["anndugol"],"error":["ayiibe","faljere","hakkee"],"return":["artugol"],"help":["ballal","dankata","faabaade"],"letter":["bataake"],"after":["caggal","ontuma","ɓaawo"],"price":["coggu"],"stop":["darnugol","faddagol","haaɗugol"],"work":["darnugol","ciiwdi","golle"],"year":["duuɓi"],"free":["dimo","hettaare"],"mistake":["faljere"],"call":["ewnagol","innugol","noddugol"],"lie":["fenaande","waalagol"],"look":["fewtugol","nandude","nanndugol"],"all":["fow","haddu","kala"],"finish":["gaynugol","haaɗugol","joofugol"],"end":["gaynugol","haaɗugol","kattuba"],"succeed":["gaynugol","laatagol","lontagol"],"language":["haala","ɗemŋgal"],"message":["haala","nelal"],"hide":["gurii","suumugol"],"wait":["habbagol","tijjagol"],"quickly":["heña"],"name":["innde","innugol","toɗɗagol"],"now":["jonta"],"receive":["jaɓɓagol"],"give":["jonnugol"],"read":["jangude","janngugol"],"listen":["jentagol","ɗoftagol"],"merchant":["jula","yeeyoowo"],"money":["kaalisi"],"new":["keso"],"back":["kééci","ɓaawo","ɓaawoojo"],"month":["lewru"],"sell":["marsingol","soorugo","yeeyugol"],"remain":["luttugol"],"close":["maɓɓugo","moggo","takko"],"open":["maɓɓititgo","udditugol"],"keep":["marugol"],"good":["moƴƴo","suuraare"],"enter":["naatugol"],"see":["ndaarugol"],"send":["naɓugol","nelde"],"water":["ndiyam"],"salary":["ngeenaari"],"wage":["ngeenaari"],"success":["poolal","ɓantaare"],"reason":["sababu"],"date":["ribinoore","saanga"],"pay":["rentagol"],"refuse":["saltagol"],"lack":["sannugol","ŋakkugol"],"many":["sowre","ɗuuɗugol"],"buy":["soodgo","soodugol"],"secret":["suuraare"],"security":["suuraare"],"account":["tinndol"],"little":["tokooso"],"write":["winndugol"],"change":["waylugol"],"speak":["wowlugol"],"day":["ñallal","ñalaande"],"debt":["ñamaande"],"telephone":["ɓoggol"]},"dua":{"person":["moto"],"water":["madíbá"]},"bas":{"water":["malép"]},"bbj":{"good":["bùŋ","pəpúŋ"],"all":["awɛ́"],"open":["cwaə́'"],"lie":["cwánwə̀"],"secret":["càm"],"remain":["cʉ́'"],"look":["cʉ'","lé","mcʉ̀"],"send":["cyà"],"bad":["cwə̀pùŋ"],"day":["dzʉ̌","tyə́'"],"new":["cùŋ","sə́"],"never":["dà"],"sell":["fìŋ","syàp"],"speak":["ghɔ̀m","sò"],"language":["ghɔ̀m"],"work":["fà'"],"give":["há","pà'"],"help":["hé","kwítə́"],"ask":["hə́ŋ","ló"],"take":["kwí","kə̀","lə̀"],"call":["ké"],"read":["ké"],"enter":["kó"],"wage":["ló'"],"lack":["kɔ̀m"],"close":["kə̀ŋ","vì'"],"keep":["lwɔ̀'"],"finish":["mì"],"person":["mò"],"back":["lə̂","ŋka'tə̀"],"accept":["píŋ"],"before":["nə̂"],"wait":["pyáp"],"water":["shyə"],"buy":["syàp","yó"],"pay":["syàp"],"enough":["sàk"],"hide":["pɔ̀m","tʉ̀m","tʉ̀mnyə̀"],"thousand":["shǎ'"],"thief":["shǔŋ"],"no":["sɔ̀m"],"name":["tsǒ"],"many":["yɔ́m"],"write":["və̀"],"see":["yɔ́"],"know":["zhyə","zhyə́"],"money":["ŋkap"],"yes":["ə̌ŋ"],"steal":["zhʉ̀","ŋɛ́"]},"bkm":{"water":["mu","jva"],"quickly":["nyas"],"person":["wul"]},"nge":{}}}};
/*
 * Langwa: protection of financial information.
 *
 * Every amount, fee, percentage, phone number, account number, reference,
 * date, beneficiary name and user-typed value is:
 *   1. detected and replaced by an opaque token (⟦A⟧, ⟦B⟧ ...) BEFORE any
 *      translation step, so no translator (human glossary or AI) can alter it
 *      and no sensitive value ever leaves the browser;
 *   2. restored verbatim after translation;
 *   3. re-checked by verify(): if a single protected value is missing or an
 *      unexpected number appears, the translation is BLOCKED and the original
 *      text is shown instead.
 *
 * Works as a classic script (browser) and as a CommonJS module (Node tests).
 */
(function (root) {
  'use strict';

  // Numbers: grouped thousands ("25 000", "1.500,50", "10,000.00") or plain.
  const NUM = String.raw`\d{1,3}(?:[   .,]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d+)?`;
  const CUR = String.raw`F\s?CFA|FCFA|XAF|XOF|CFA|EUR|USD|GBP|€|\$|£`;

  const SIGN = String.raw`(?:[+\-−–]\s?)?`; // keep "-12,500 FCFA" vs "+180,000 FCFA": a lost sign flips debit/credit
  const MONTHS = String.raw`janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre|January|February|March|April|May|June|July|August|September|October|November|December|janv\.?|févr\.?|avr\.?|juil\.?|sept\.?|oct\.?|nov\.?|déc\.?|Jan\.?|Feb\.?|Mar\.?|Apr\.?|Jun\.?|Jul\.?|Aug\.?|Sep\.?|Oct\.?|Nov\.?|Dec\.?`;

  const RULES = [
    { type: 'email', priority: 9, re: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g },
    { type: 'url', priority: 9, re: /\bhttps?:\/\/[^\s<>"']+/g },
    { type: 'iban', priority: 8, re: /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){3,7}(?: ?[A-Z0-9]{1,4})?\b/g },
    // Local account numbers such as "CM 001 2345 6789 01".
    { type: 'account', priority: 8, re: /\b[A-Z]{2}(?:[ -]?\d{2,6}){3,7}\b/g },
    { type: 'money', priority: 7, re: new RegExp(`(?<![\\p{L}\\d])${SIGN}(?:(?:${CUR})\\s?(?:${NUM})|(?:${NUM})\\s?(?:${CUR}))(?![A-Za-z])`, 'gu') },
    // Full dates with month names ("November 5, 2026", "5 novembre 2026") are kept verbatim.
    { type: 'date', priority: 6, re: new RegExp(`(?:\\b\\d{1,2}(?:er)?\\s+(?:${MONTHS})(?:\\s+\\d{4})?|(?<![\\p{L}])(?:${MONTHS})\\s+\\d{1,2}(?:,?\\s+\\d{4})?)(?![\\p{L}])`, 'giu') },
    // Cameroon numbers: "+237 6 99 12 34 56", "677 12 34 56", "699123456", "+237 699 123 456".
    { type: 'phone', priority: 6, re: /(?:\+237[\s.-]?)?(?<!\d)[26](?:[\s.-]?\d){8}(?!\d)/g },
    // Other international numbers.
    { type: 'phone', priority: 5, re: /\+\d{1,3}(?:[\s.-]?\d){6,12}(?!\d)/g },
    { type: 'percent', priority: 6, re: /\d+(?:[.,]\d+)?\s?%/g },
    { type: 'masked-account', priority: 6, re: /[*•xX]{2,}[\s-]?\d{2,}|\d{2,}[\s-]?[*•]{2,}/g },
    { type: 'date', priority: 5, re: /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/g },
    { type: 'time', priority: 5, re: /\b\d{1,2}(?::|h)\d{2}\b/g },
    { type: 'reference', priority: 6.5, re: /\b(?=[A-Z0-9-]*\d)(?=[A-Z0-9-]*[A-Z])[A-Z0-9]+(?:-[A-Z0-9]+)+\b|\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{4,}\b/g },
    // Proper names right after "à / to / from / pour / vers / M. / Mme ..." (beneficiaries).
    { type: 'name', priority: 3, re: /(?<=(?:^|[\s(])(?:à|to|from|pour|for|vers|M\.|Mme|Mlle|Mr\.?|Mrs\.?|Dr\.?|Hello,?|Hi,?|Bonjour,?|Bonsoir,?)\s+)[A-ZÀ-Ý][\p{L}'’-]+(?:\s+[A-ZÀ-Ý][\p{L}'’-]+){0,3}/gu },
    { type: 'number', priority: 1, re: new RegExp(`(?<![\\p{L}\\d])${SIGN}(?:${NUM})(?![\\p{L}\\d])`, 'gu') },
  ];

  function normSpaces(s) {
    return String(s).normalize('NFC').replace(/[   ]/g, ' ');
  }

  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Find every protected value in `text`. Non-overlapping, sorted by position. */
  /**
   * Brand and platform names are never translated: "Safinum Pay" stays "Safinum Pay".
   * Built-in Cameroonian financial brands + names Langwa reads from the page itself (opts.brands).
   */
  const BRANDS = [
    'Safinum Pay', 'Safinum', 'Afriland First Bank', 'Afriland', 'Orange Money', 'MTN Mobile Money', 'MTN MoMo', 'MoMo',
    'Express Union', 'Ecobank', 'UBA', 'BICEC', 'SGC', 'Société Générale', 'CCA Bank', 'Commercial Bank', 'Wafacash',
    'Visa', 'Mastercard', 'WhatsApp', 'Google', 'GIMAC', 'CEMAC', 'BEAC', 'CNEF', 'Huawei',
  ];

  function extract(text, opts = {}) {
    const cands = [];
    for (const b of [...(opts.brands || []), ...BRANDS]) {
      const l = normSpaces(b).trim();
      if (l.length < 2) continue;
      const re = new RegExp(`(?<![\\p{L}\\d])${escapeRe(l)}(?![\\p{L}\\d])`, 'gu');
      let m;
      while ((m = re.exec(text))) cands.push({ start: m.index, end: m.index + l.length, type: 'brand', priority: 9.5 + l.length / 1000 });
    }
    for (const lit of opts.literals || []) {
      const l = normSpaces(lit).trim();
      if (l.length < 2) continue;
      const re = new RegExp(escapeRe(l), 'g');
      let m;
      while ((m = re.exec(text))) cands.push({ start: m.index, end: m.index + l.length, type: 'user-value', priority: 10 });
    }
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(text))) {
        if (!m[0]) { rule.re.lastIndex++; continue; }
        cands.push({ start: m.index, end: m.index + m[0].length, type: rule.type, priority: rule.priority });
      }
    }
    // Highest priority first, then longest; keep only non-overlapping.
    cands.sort((a, b) => b.priority - a.priority || (b.end - b.start) - (a.end - a.start) || a.start - b.start);
    const kept = [];
    for (const c of cands) {
      if (kept.some(k => c.start < k.end && k.start < c.end)) continue;
      kept.push(c);
    }
    kept.sort((a, b) => a.start - b.start);
    return kept.map(c => ({ ...c, value: text.slice(c.start, c.end) }));
  }

  function keyFor(i) {
    let s = '';
    let n = i + 1;
    while (n > 0) {
      const r = (n - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      n = Math.floor((n - 1) / 26);
    }
    return `⟦${s}⟧`;
  }

  /** Replace protected values by tokens. Returns { masked, tokens:[{key,value,type}] }. */
  function mask(text, opts = {}) {
    const t = normSpaces(text);
    const ents = extract(t, opts);
    let out = '';
    let pos = 0;
    const tokens = ents.map((e, i) => {
      const key = keyFor(i);
      out += t.slice(pos, e.start) + key;
      pos = e.end;
      return { key, value: e.value, type: e.type };
    });
    out += t.slice(pos);
    return { masked: out, tokens };
  }

  /** Put the original values back. Every token must appear exactly once. */
  function unmask(translated, tokens) {
    const problems = [];
    const found = String(translated).match(/⟦[^⟧]{0,8}⟧/g) || [];
    for (const t of tokens) {
      const n = found.filter(f => f === t.key).length;
      if (n !== 1) problems.push(`value "${t.value}" appears ${n} time(s) instead of once`);
    }
    const unknown = found.filter(f => !tokens.some(t => t.key === f));
    if (unknown.length) problems.push(`unknown token(s) ${unknown.join(' ')}`);
    const text = String(translated).replace(/⟦[A-Z]+⟧/g, m => {
      const tok = tokens.find(t => t.key === m);
      return tok ? tok.value : m;
    });
    return { text, ok: problems.length === 0, problems };
  }

  function countOcc(hay, needle) {
    if (!needle) return 0;
    let n = 0;
    let i = hay.indexOf(needle);
    while (i !== -1) { n++; i = hay.indexOf(needle, i + needle.length); }
    return n;
  }

  /**
   * Integrity check between the original text and its translation.
   * - every protected value of the original must be present, character for character,
   *   at least as many times as in the original;
   * - the translation must not contain any digit that is not part of a protected value.
   */
  function verify(original, translated, opts = {}) {
    const o = normSpaces(original);
    const c = normSpaces(translated);
    const ents = extract(o, opts);
    const counts = new Map();
    for (const e of ents) counts.set(e.value, (counts.get(e.value) || 0) + 1);
    const problems = [];
    for (const [v, n] of counts) {
      if (countOcc(c, v) < n) problems.push({ type: 'missing', value: v });
    }
    let rest = c;
    for (const v of [...counts.keys()].sort((a, b) => b.length - a.length)) rest = rest.split(v).join(' ');
    const stray = rest.match(/\d+/g);
    if (stray) problems.push({ type: 'unexpected-number', value: stray.join(', ') });
    return { ok: problems.length === 0, problems, entities: ents };
  }

  const api = { extract, mask, unmask, verify, normSpaces };
  root.LangwaProtect = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

/*
 * Langwa: translation engine (no network, deterministic).
 *
 * Order of resolution for a piece of interface text:
 *   1. Glossary / templates validated by native speakers
 *      ("Vous allez envoyer {amount} à {name}." matches any amount and name).
 *   2. "Label : value" split: the label is translated, the value is kept verbatim
 *      (beneficiary names, account numbers, amounts are never touched).
 *   3. Local open-source machine translation (done by the caller, optional).
 *   4. Safe summary ("gist"): a pre-validated sentence saying what KIND of message it is
 *      (error / security warning / success / information) + the known key words + the
 *      protected amounts. Always correct in meaning, even for brand-new content.
 * Every assembled result is re-checked with LangwaProtect.verify().
 */
(function (root) {
  'use strict';
  const P = root.LangwaProtect || (typeof require !== 'undefined' ? require('./protect.js') : null);

  const TOKEN_RE = /⟦[A-Z]+⟧/g;

  function norm(s) {
    return P.normSpaces(s)
      .replace(/[’‘`´]/g, "'")
      .replace(/[“”«»]/g, '"')
      .replace(/…/g, '...')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Lookup key: tokens -> {}, lower case, tidy punctuation, no trailing punctuation. */
  function keyOf(masked) {
    return norm(masked)
      .replace(TOKEN_RE, '{}')
      .toLowerCase()
      .replace(/\s+([:;,.!?])/g, '$1')
      .replace(/[\s.!?:;]+$/, '');
  }

  const KIND_RES = {
    error: /(?<![\p{L}])(erreur|échec|échoué|incorrecte?|invalide|insuffisante?|refusée?|impossible|bloquée?|expirée?|error|failed|failure|incorrect|invalid|insufficient|declined|denied|rejected|locked|blocked|expired)(?![\p{L}])/iu,
    warning: /(?<![\p{L}])(attention|avertissement|jamais|méfiez|fraude|arnaque|sécurité|irréversible|vérifiez toujours|ne peut pas être annulé|warning|caution|never|beware|fraud|scam|security|irreversible|always check|cannot be (?:undone|reversed|cancell?ed))(?![\p{L}])/iu,
    success: /(?<![\p{L}])(succès|réussie?|effectuée?|confirmée?|success|successful(?:ly)?|completed|confirmed)(?![\p{L}])/iu,
  };

  /**
   * Message kind. Short labels are headings, not messages: "Security" or "Success" alone is a
   * title or a status, so a warning/success needs 3+ words and an error 2+ ("Solde insuffisant").
   */
  function classify(text) {
    const words = (String(text).match(/\p{L}+/gu) || []).length;
    if (words >= 2 && KIND_RES.error.test(text)) return 'error';
    if (words >= 3 && KIND_RES.warning.test(text)) return 'warning';
    if (words >= 3 && KIND_RES.success.test(text)) return 'success';
    return null;
  }

  /** "Vous allez envoyer {amount} à {name}." -> segs ["Vous allez envoyer ", " à ", "."], names ["amount","name"] */
  function splitTemplate(t) {
    const segs = [];
    const names = [];
    let last = 0;
    String(t || '').replace(/\{(\w+)\}/g, (m, n, i) => { segs.push(t.slice(last, i)); names.push(n); last = i + m.length; return m; });
    segs.push(String(t || '').slice(last));
    return { segs, names };
  }

  const fold = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function createEngine(pack) {
    const index = new Map(); // key -> { entry, names }
    const phrases = [];      // for gist key-word spotting: { key, entry }
    const byId = new Map();
    const knownWords = new Set(); // every word of every source string (translated or not)

    for (const e of pack.entries || []) {
      byId.set(e.id, e);
      for (const src of [e.fr, e.en, ...(e.variants || [])].filter(Boolean)) {
        for (const w of src.toLowerCase().split(/[^\p{L}']+/u)) if (w.length > 2) knownWords.add(w);
      }
      if (!e.t || !e.t.trim()) continue;
      for (const src of [e.fr, e.en, ...(e.variants || [])].filter(Boolean)) {
        const names = [];
        const tpl = src.replace(/\{(\w+)\}/g, (_, n) => { names.push(n); return '⟦X⟧'; });
        const key = keyOf(tpl);
        if (!index.has(key)) index.set(key, { entry: e, names });
        if (!names.length && key.length >= 3 && !e.id.startsWith('gist_') && e.group !== 'ui') phrases.push({ key, entry: e });
      }
    }
    phrases.sort((a, b) => b.key.length - a.key.length);

    /**
     * Speech plan for an entry: human recordings of the national-language text, with the
     * protected values (amounts, names...) in between.
     * Steps: {audio} recorded clip | {missing, text} not recorded | {value, type} protected value.
     */
    function speechFor(entry, names, tokens) {
      const { segs, names: tNames } = splitTemplate(entry.t);
      if (!tNames.length) return [entry.audio ? { audio: entry.audio } : { missing: true, text: entry.t }];
      const parts = entry.audioParts || [];
      const steps = [];
      segs.forEach((seg, i) => {
        if (/\p{L}/u.test(seg)) steps.push(parts[i] ? { audio: parts[i] } : { missing: true, text: seg.trim() });
        if (i < tNames.length) {
          const tok = tokens[names.indexOf(tNames[i])];
          if (tok) steps.push({ value: tok.value, type: tok.type });
        }
      });
      return steps;
    }

    function lookupMasked(masked, allTokens) {
      // Brand tokens are compared as their text ("Safinum account"), not as placeholders.
      const brands = allTokens.filter(t => t.type === 'brand');
      for (const b of brands) masked = masked.split(b.key).join(b.value);
      const tokens = allTokens.filter(t => t.type !== 'brand');
      const hit = index.get(keyOf(masked));
      if (!hit || hit.names.length !== tokens.length) return null;
      let t = hit.entry.t;
      hit.names.forEach((n, i) => { t = t.split(`{${n}}`).join(tokens[i].value); });
      if (/\{\w+\}/.test(t)) return null;
      return {
        text: t,
        verified: !!hit.entry.verified,
        audio: hit.names.length ? '' : (hit.entry.audio || ''),
        speech: speechFor(hit.entry, hit.names, tokens),
        explain: hit.entry.x || '', // optional plain-language explanation written by the speaker
        id: hit.entry.id,
        source: 'glossary',
      };
    }

    // "Jean-Paul Mbarga", "Amina Ngo Bell", "Safinum Pay": 1-4 capitalised words, none of
    // them a known glossary word -> a name or brand, shown as-is (never translated).
    function looksLikeProperName(s) {
      const words = s.split(/\s+/);
      if (words.length > 4 || !words.every(w => /^\p{Lu}[\p{L}'’.-]*$/u.test(w))) return false;
      return !words.some(w => knownWords.has(w.toLowerCase()));
    }

    function isValueLike(rest, literals) {
      const m = P.mask(rest, { literals });
      const words = m.masked.replace(TOKEN_RE, ' ').match(/\p{L}+/gu) || [];
      return words.length <= 4;
    }

    /** Split a text into parts: 'tr' parts to translate, 'lit' parts kept verbatim. */
    function plan(text, literals = [], brands = []) {
      const clean = norm(text);
      const whole = { kind: 'tr', text: clean, ...P.mask(clean, { literals, brands }) };
      // Pure values ("25,000 FCFA", "+237 6 99 12 34 56", a typed name): nothing to translate.
      if (!/\p{L}{2,}/u.test(whole.masked.replace(TOKEN_RE, ''))) {
        const brand = whole.tokens.length && whole.tokens.every(t => t.type === 'brand');
        return { skip: true, value: true, brand, text: clean };
      }
      if (lookupMasked(whole.masked, whole.tokens)) return { text: clean, parts: [whole] };
      if (looksLikeProperName(clean)) return { skip: true, value: true, text: clean };

      const lv = clean.match(/^([^\d:]{1,40}?)(\s*:\s*)(.+)$/s);
      if (lv && /\p{L}{2,}/u.test(lv[1]) && isValueLike(lv[3], literals)) {
        const label = lv[1].trim();
        const rest = lv[3];
        const restMask = P.mask(rest, { literals, brands });
        const restPart = lookupMasked(restMask.masked, restMask.tokens)
          ? { kind: 'tr', text: rest, ...restMask }
          : { kind: 'lit', text: rest };
        return {
          text: clean,
          parts: [{ kind: 'tr', text: label, ...P.mask(label, { literals, brands }) }, { kind: 'lit', text: lv[2] }, restPart],
        };
      }
      return { text: clean, parts: [whole] };
    }

    /** Known glossary terms found inside an unknown sentence (longest first, no overlap). */
    function keywords(masked) {
      const k = ' ' + keyOf(masked).replace(/[{}(),;:.!?"]/g, ' ').replace(/\s+/g, ' ') + ' ';
      const found = [];
      let rest = k;
      for (const p of phrases) {
        const needle = ' ' + p.key.replace(/[{}(),;:.!?"]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
        if (needle.trim().length < 3) continue;
        if (rest.includes(needle)) {
          found.push(p.entry);
          rest = rest.split(needle).join(' | ');
        }
      }
      return [...new Set(found)];
    }

    /** Pre-validated, meaning-safe summary of a message we cannot translate fully. */
    function gist(original, literals = []) {
      const clean = norm(original);
      const kind = classify(clean) || 'info';
      const head = byId.get('gist_' + kind);
      if (!head || !head.t) return null;
      const m = P.mask(clean, { literals });
      const kws = keywords(m.masked).filter(e => e.t);
      const values = m.tokens.map(t => t.value);
      let text = head.t;
      if (kws.length) {
        const kwLabel = byId.get('gist_keywords');
        text += ` ${kwLabel && kwLabel.t ? kwLabel.t : '•'} ${kws.map(e => e.t).join(' · ')}`;
      }
      if (values.length) text += ` · ${values.join(' · ')}`;
      const speech = [
        head.audio ? { audio: head.audio } : { missing: true, text: head.t },
        ...kws.map(e => (e.audio ? { audio: e.audio } : { missing: true, text: e.t })),
        ...m.tokens.map(t => ({ value: t.value, type: t.type })),
      ];
      return {
        speech,
        status: 'gist',
        text,
        original: clean,
        verified: !!head.verified && kws.every(e => e.verified),
        sources: ['gist'],
        kind,
        audio: head.audio || '',
        integrity: P.verify(clean, text, { literals }),
      };
    }

    /**
     * Assemble translated parts.
     * outs[i] is { text, verified, source, audio?, confidence? } | { blocked, problems } | null (unknown).
     */
    function finalize(original, planned, outs, literals = []) {
      const clean = planned.text;
      const kind = classify(clean);
      const base = { original: clean, kind };
      const blocked = outs.find(o => o && o.blocked);
      if (blocked) {
        const g = gist(clean, literals);
        return g && g.integrity.ok ? { ...g, note: 'mt-blocked', problems: blocked.problems }
          : { ...base, status: 'blocked', text: clean, problems: blocked.problems };
      }
      if (outs.some(o => !o)) {
        const g = gist(clean, literals);
        return g && g.integrity.ok ? g : { ...base, status: 'untranslated', text: clean, words: lexiconHits(clean) };
      }
      const text = outs.map(o => o.text).join('');
      const integrity = P.verify(clean, text, { literals });
      if (!integrity.ok) {
        const g = gist(clean, literals);
        return g && g.integrity.ok ? { ...g, note: 'integrity-failed', problems: integrity.problems }
          : { ...base, status: 'blocked', text: clean, problems: integrity.problems };
      }
      const trOuts = outs.filter(o => o.source !== 'literal');
      const speech = outs.flatMap(o => {
        if (o.speech) return o.speech;
        if (o.source === 'literal') return /[\p{L}\d]/u.test(o.text) ? [{ value: o.text.trim() }] : [];
        return [{ tts: o.text }]; // machine translation: only a synthetic voice can read it
      });
      return {
        speech,
        ids: trOuts.map(o => o.id).filter(Boolean),
        id: trOuts.length === 1 ? trOuts[0].id : undefined,
        explain: trOuts.map(o => o.explain).filter(Boolean).join(' '),
        ...base,
        status: 'ok',
        text,
        verified: trOuts.every(o => o.verified),
        sources: [...new Set(trOuts.map(o => o.source))],
        confidence: trOuts.find(o => o.confidence) ? trOuts.find(o => o.confidence).confidence : undefined,
        audio: outs.length === 1 ? outs[0].audio || '' : (trOuts.length === 1 && trOuts[0].audio) || '',
        integrity,
      };
    }

    /** Synchronous translation with glossary only (used by tests and the options page). */
    function translateLocal(text, literals = []) {
      const p = plan(text, literals);
      if (p.skip) return null;
      const outs = p.parts.map(part => part.kind === 'lit'
        ? { text: part.text, verified: true, source: 'literal' }
        : lookupMasked(part.masked, part.tokens));
      return finalize(text, p, outs, literals);
    }

    /**
     * Dictionary words (open sources, not validated) found in a sentence that has no translation:
     * "Payer la facture" -> [{ src: 'payer', term: 'sáwa' }]. Shown as hints, never as a translation.
     */
    const lex = pack.lexicon || null;
    function lexiconHits(text) {
      if (!lex) return [];
      const out = [];
      const words = fold(P.mask(norm(text)).masked.replace(TOKEN_RE, ' ')).match(/[a-z]+/g) || [];
      for (const w of new Set(words)) {
        if (w.length < 3) continue;
        for (const form of [w, w.replace(/s$/, ''), w.replace(/es$/, ''), w.replace(/(e|er|ez|e?d|ing)$/, '')]) {
          const hit = (lex.fr && lex.fr[form]) || (lex.en && lex.en[form]);
          if (hit && hit.length) { if (!out.some(o => o.src === form)) out.push({ src: form, term: hit[0] }); break; }
        }
        if (out.length >= 6) break;
      }
      return out;
    }

    return { plan, lookupMasked, finalize, gist, keywords, translateLocal, lexiconHits, size: index.size };
  }

  const api = { createEngine, keyOf, norm, classify, splitTemplate };
  root.LangwaEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

/*
 * Langwa: reading translations aloud with natural voices.
 *
 * National-language text is ONLY played from human recordings made by the native-speaker
 * validator (or, for Fulfulde, from the local MMS neural voice if enabled). It is never read by
 * a French/English synthetic voice, which would mispronounce it.
 * Protected values (amounts, names, numbers) are read exactly, with the most natural French
 * voice available (Edge "Natural"/"Online" voices, Google voices...), the way amounts are
 * commonly spoken in Cameroon.
 */
(function (root) {
  'use strict';
  const P = root.LangwaProtect || (typeof require !== 'undefined' ? require('./protect.js') : null);

  const CURRENCIES = [
    [/^(?:F\s?CFA|FCFA|XAF|XOF|CFA)$/i, 'francs CFA'],
    [/^(?:EUR|€)$/i, 'euros'],
    [/^(?:USD|\$)$/i, 'dollars'],
    [/^(?:GBP|£)$/i, 'livres sterling'],
  ];

  /** "25,000" / "25 000" / "1.500,50" / "1,5" -> "25000" / "25000" / "1500,50" / "1,5" */
  function spokenNumber(n) {
    const s = String(n).replace(/[\s  ]/g, '');
    const m = s.match(/^([\d.,]*?)[.,](\d{1,2})$/);
    const int = (m ? m[1] : s).replace(/[.,]/g, '');
    return m ? `${int},${m[2]}` : int;
  }

  const spell = s => String(s).replace(/[\s-]+/g, ' ').trim().split(' ')
    .map(g => g.split('').join(' ')).join(', ');

  /** Exact spoken form of one protected value. */
  function speakValue(value, type) {
    const v = P.normSpaces(value).trim();
    const signM = v.match(/^([+\-−–])\s?/);
    const sign = signM ? (signM[1] === '+' ? 'plus ' : 'moins ') : '';
    const body = signM ? v.slice(signM[0].length) : v;
    switch (type) {
      case 'money': {
        const num = (body.match(/\d[\d\s.,]*\d|\d/) || [''])[0];
        const cur = body.replace(num, '').trim();
        const word = (CURRENCIES.find(([re]) => re.test(cur)) || [null, cur])[1];
        return `${sign}${spokenNumber(num)} ${word}`.trim();
      }
      case 'number': return `${sign}${spokenNumber(body)}`;
      case 'percent': return `${sign}${spokenNumber(body.replace('%', ''))} pour cent`;
      case 'phone': return (v.startsWith('+') ? 'plus ' : '') + v.replace(/^\+/, '').split(/[\s.-]+/).join(', ');
      case 'account': case 'iban': case 'reference': case 'masked-account': return spell(v);
      default: return v;
    }
  }

  /** Any text: each protected value replaced by its spoken form. */
  function speakable(text) {
    const t = P.normSpaces(text);
    const ents = P.extract(t);
    let out = '';
    let pos = 0;
    for (const e of ents) { out += t.slice(pos, e.start) + speakValue(e.value, e.type); pos = e.end; }
    return out + t.slice(pos);
  }

  /**
   * Coaches a French voice to read text written in the General Alphabet of Cameroon Languages
   * (Fulfulde, Ewondo, Duala...). Used only when no human recording exists, and labelled
   * "synthetic voice" in the interface.
   *   ɓ ɗ ƴ -> b d y,  ŋ -> ng,  c -> tch,  j -> dj,  ny -> gn,  u -> ou,  e -> é,
   *   long vowels shortened, g kept hard, s kept unvoiced, tone marks removed.
   */
  const LOANWORDS = new Set(['code', 'internet', 'safinum', 'pay', 'hackathon', 'mobile', 'money', 'orange', 'momo', 'sms', 'francs', 'fcfa', 'cfa']);
  function adaptReading(text) {
    let t = String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
    t = t.replace(/ɓ/g, 'b').replace(/Ɓ/g, 'B').replace(/ɗ/g, 'd').replace(/Ɗ/g, 'D')
      .replace(/ƴ/g, 'y').replace(/Ƴ/g, 'Y').replace(/ŋ/g, 'ng').replace(/Ŋ/g, 'Ng')
      .replace(/ɛ/g, 'è').replace(/Ɛ/g, 'È').replace(/ɔ/g, 'o').replace(/Ɔ/g, 'O').replace(/ə/g, 'e').replace(/Ə/g, 'E')
      .replace(/['’]/g, '');
    return t.split(/(\s+|[,.;:!?()]+)/).map(w => {
      if (!/\p{L}/u.test(w) || /^[A-Z0-9]{2,}$/.test(w) || LOANWORDS.has(w.toLowerCase())) return w; // acronyms (PIN), French loanwords
      return w
        .replace(/ny/gi, m => (m[0] === 'N' ? 'Gn' : 'gn'))
        .replace(/c/g, 'tch').replace(/C/g, 'Tch')
        .replace(/j/g, 'dj').replace(/J/g, 'Dj')
        .replace(/aa/g, 'a').replace(/ee/g, 'é').replace(/ii/g, 'i').replace(/oo/g, 'o').replace(/uu/g, 'ou')
        .replace(/(?<![oO])u/g, 'ou').replace(/U/g, 'Ou')
        .replace(/e(?![éèê])/g, 'é')
        .replace(/g([eéèiy])/g, 'gu$1')
        .replace(/([aeéèiouy])s([aeéèiouy])/g, '$1ss$2');
    }).join('');
  }

  // ---------------- playback ----------------
  /**
   * Best voice for a list of language prefixes. Online voices (Edge "Natural", Google) sound far
   * more natural but send the spoken text to Microsoft or Google, so they are used only when the
   * user allows it. Neural/natural voices are preferred over older ones.
   */
  function pickVoice(prefixes, allowOnline) {
    if (!root.speechSynthesis) return null;
    const all = root.speechSynthesis.getVoices().filter(v => allowOnline || v.localService);
    const score = v => {
      const name = v.name || '';
      // SpeechSynthesisVoice has no gender field; use common natural-voice name hints.
      const feminine = /female|woman|aria|jenny|sonia|natasha|ava|zira|sara|sarah|hazel|ezinne|adaeze|chioma/i.test(name);
      const masculine = /\b(male|man|david|mark|guy|james|ab\w+o)\b/i.test(name);
      return (/natural|neural|premium|enhanced/i.test(name) ? 30 : 0)
        + (/online|google/i.test(name) ? 8 : 0)
        + (feminine ? 14 : 0) - (masculine ? 8 : 0)
        + (/^fr[-_](CM|FR)/i.test(v.lang) ? 2 : 0);
    };
    const candidates = all.map(v => ({
      voice: v,
      locale: prefixes.findIndex(p => v.lang.toLowerCase().startsWith(p)),
    })).filter(x => x.locale >= 0);
    candidates.sort((a, b) => (score(b.voice) - b.locale * 3) - (score(a.voice) - a.locale * 3));
    return candidates.length ? candidates[0].voice : null;
  }
  const bestFrenchVoice = (allowOnline = false) => pickVoice(['fr'], allowOnline);

  /**
   * Light adaptation for an African voice (Swahili): its vowels, "ny", "ng'" and "ch" already sound
   * like Fulfulde, Ewondo or Duala, so only special letters need replacing. Much more natural than
   * a French voice.
   */
  function adaptForSwahili(text) {
    return String(text).split(/(\s+)/).map(w => (LOANWORDS.has(w.toLowerCase().replace(/[^a-z]/g, '')) ? w : swWord(w))).join('');
  }
  function swWord(text) {
    return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC')
      .replace(/ɓ/g, 'b').replace(/Ɓ/g, 'B').replace(/ɗ/g, 'd').replace(/Ɗ/g, 'D').replace(/ƴ/g, 'y').replace(/Ƴ/g, 'Y')
      .replace(/ŋ/g, "ng'").replace(/Ŋ/g, "Ng'").replace(/ɛ/g, 'e').replace(/ɔ/g, 'o').replace(/ə/g, 'e')
      .replace(/c(?!h)/g, 'ch').replace(/C(?!h)/g, 'Ch').replace(/['’](?!\s)/g, '');
  }

  /** Voice for national-language text: an African voice if available, else French with coaching. */
  /**
   * Voice for the national-language text. Each language can name its preferred voices
   * (lang/languages.json "voices"): Pidgin uses Nigerian/Cameroonian/Ghanaian English voices and
   * reads as written ("reading": "none"); other languages use an African voice (Swahili) with light
   * adaptation, or a coached French voice as a last resort.
   */
  function nationalVoice(allowOnline, lang = {}) {
    if (lang.voices && lang.voices.length) {
      const v = pickVoice(lang.voices.map(x => x.toLowerCase()), allowOnline);
      if (v) return { voice: v, adapt: lang.reading === 'none' ? (t => t) : adaptForSwahili, sameForValues: lang.reading === 'none' };
    }
    const african = pickVoice(['sw', 'ha', 'ln', 'yo'], allowOnline);
    if (african) return { voice: african, adapt: adaptForSwahili };
    return { voice: bestFrenchVoice(allowOnline), adapt: adaptReading };
  }
  if (root.speechSynthesis) {
    root.speechSynthesis.getVoices(); // the list loads asynchronously
    if (root.speechSynthesis.addEventListener) root.speechSynthesis.addEventListener('voiceschanged', () => root.speechSynthesis.getVoices());
  }

  function createPlayer({ tts, online = () => false, language = () => ({}) } = {}) {
    let session = null;

    function stop() {
      if (session) {
        session.stopped = true;
        if (session.audio) session.audio.pause();
        if (session.onStop) session.onStop();
      }
      if (root.speechSynthesis) root.speechSynthesis.cancel();
      session = null;
    }

    const playUrl = (url, s) => new Promise(res => {
      const a = new Audio(url);
      s.audio = a;
      a.onended = a.onerror = () => res();
      a.play().catch(() => res());
    });

    const say = (text, voice, s) => new Promise(res => {
      if (!root.speechSynthesis || s.stopped || !text.trim()) return res();
      const u = new SpeechSynthesisUtterance(text);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'fr-FR';
      u.rate = 1;     // natural pace
      u.pitch = 1;
      u.onend = u.onerror = () => res();
      root.speechSynthesis.speak(u);
    });

    /**
     * Turns a speech plan into playable steps. Missing recordings are filled, in this order,
     * by the local neural voice (opts.tts) or the device voice coached to the language's
     * spelling (opts.approx). Without either, a sentence with a missing recording is not
     * played at all (never half a sentence). The result carries .voice:
     * 'human' (only recordings), 'neural' or 'synthetic'.
     */
    function prepare(steps, opts) {
      if (!steps || !steps.length) return null;
      const o = typeof opts === 'object' && opts ? opts : { tts: !!opts, approx: false };
      let voice = 'human';
      const out = steps.map(s => {
        if (s.missing && o.tts) { voice = 'neural'; return { tts: s.text }; }
        if (s.missing && o.approx) { if (voice === 'human') voice = 'synthetic'; return { nat: s.text }; }
        if (s.tts && !o.tts) return o.approx ? (voice = 'synthetic', { nat: s.tts }) : s;
        return s;
      });
      if (out.some(s => s.missing || (s.tts && !o.tts))) return null;
      out.voice = voice;
      return out;
    }

    /**
     * Plays the steps. onSource(source, why) reports, live, who speaks the national-language
     * text: 'human' (recording), 'wait' (local model preparing), 'local' (local model) or
     * 'browser' (device or online voice; why = 'offline' | 'loading' | 'slow' | 'error' when the
     * local model was wanted but could not answer). Amounts read in French are not reported.
     */
    async function play(steps, onStop, onSource) {
      stop();
      const s = { stopped: false, onStop };
      let last = '';
      const report = (src, why) => {
        const k = src + (why || '');
        if (k !== last && onSource && !s.stopped) { last = k; try { onSource(src, why); } catch { /* UI gone */ } }
      };
      session = s;
      // Consecutive pieces read by the same voice become ONE utterance: the sentence flows
      // instead of being spoken word group by word group.
      const allow = !!online();
      const fr = bestFrenchVoice(allow);
      const nat = nationalVoice(allow, language() || {});
      const runs = [];
      for (const step of steps) {
        let piece = null;
        // Numbers and amounts are read in French (exact figures). Names stay with the national
        // voice so the sentence does not jump between voices ("e Jean-Paul Mbarga" in one go).
        const isName = step.value && (step.type === 'name' || step.type === 'user-value' || (!step.type && !/\d/.test(step.value)));
        if (step.value && nat.sameForValues && nat.voice) piece = { voice: nat.voice, text: step.type ? speakValue(step.value, step.type).replace(/francs CFA/g, 'CFA francs') : speakable(step.value) };
        else if (step.value && isName && nat.voice && nat.voice !== fr) piece = { voice: nat.voice, text: step.value };
        else if (step.value) piece = { voice: fr, text: step.type ? speakValue(step.value, step.type) : speakable(step.value) };
        else if (step.nat) piece = { voice: nat.voice, text: nat.adapt(step.nat), national: true };
        const prev = runs[runs.length - 1];
        if (piece && prev && prev.voice === piece.voice && !prev.audio && !prev.tts) { prev.text += ` ${piece.text}`; prev.national = prev.national || piece.national; }
        else runs.push(piece || step);
      }
      // Ask the local model for every piece at once: the next one is ready while one plays.
      const pending = runs.map(r => (r.tts && tts ? Promise.resolve(tts(r.tts)).catch(() => null) : null));
      for (const [i, r] of runs.entries()) {
        if (s.stopped) break;
        if (r.audio) { report('human'); await playUrl(r.audio, s); }
        else if (r.tts && tts) {
          report('wait');
          const got = await pending[i];
          if (s.stopped) break;
          if (typeof got === 'string') { report('local'); await playUrl(got, s); }
          else { report('browser', (got && got.fail) || 'offline'); await say(nat.adapt(r.tts), nat.voice, s); }
        } else if (r.text !== undefined) {
          if (r.national) report('browser');
          await say(r.text, r.voice, s);
        }
      }
      if (session === s) { session = null; if (onStop) onStop(); }
    }

    return { play, stop, prepare, isPlaying: () => !!session };
  }

  const api = { speakValue, speakable, spokenNumber, createPlayer, bestFrenchVoice, adaptReading, adaptForSwahili, pickVoice, nationalVoice };
  root.LangwaSpeech = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

/*
 * Langwa: assistant tab ("Ask"). Answers questions about the current page in the user's
 * language, by text or by voice.
 *
 * - Built-in answers (instant, offline, exact): what is this page, how much will I pay, who
 *   receives the money, is there a warning, what do I do next, what is my balance. Built from
 *   the page itself and the validated glossary, so amounts are always the page's own.
 * - Free questions: an open-source model running on this computer (Ollama / llama.cpp), if set
 *   up. Any number in its answer must exist on the page, otherwise the answer is refused.
 * - Voice questions: local open-source speech server (Meta MMS: detects the language and
 *   transcribes, server/asr_server.py), or with consent the browser's speech recognition
 *   (French, English, Pidgin through Nigerian English).
 */
(function (root) {
  'use strict';
  const P = root.LangwaProtect;

  const foldQ = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/ɓ/g, 'b').replace(/ɗ/g, 'd').replace(/ƴ/g, 'y').replace(/ŋ/g, 'ng');

  // Keywords in French, English, Pidgin and Fulfulde (draft) for each built-in question.
  const INTENTS = [
    ['balance', /\b(solde|balance|il me reste|combien j.?ai|how much (money )?(i get|i have|i remain)|money wey i get|money wey dey|ceede am|ceede maa)\b/],
    ['receiver', /\b(qui|who|benefici\w*|receive|recoit|recevra|pesin|person|jaboowo|moye|nom|name|innde)\b/],
    ['next', /\b(next|ensuite|apres|faire|fais|maintenant|now|do now|go do|continue[rz]?|bouton|button|click|cliquer|press|jokku|wad\w*|jooni)\b/],
    ['warning', /\b(danger|attention|warning|alerte?|risk|risque|safe|secur\w*|reentino|kisal|probleme?|problem|erreur|error|wahala)\b/],
    ['amount', /\b(combien|how much|montant|amount|payer|pay|moni|money|ceede|total|frais|fees|charges?|cost|cout|debit|yob\w*|no foti)\b/],
    ['page', /\b(page|what|quoi|wetin|happen\w*|passe|about|sujet|expliqu\w*|explain|hondum|ki be|ndoo|doo|hello ngol)\b/],
  ];
  const detectIntent = q => (INTENTS.find(([, re]) => re.test(foldQ(q))) || [null])[0];

  function create(ctx) {
    const { h, icon, ui, state, send, player, voiceOpts, shownText, setLight, api } = ctx;
    const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    const chat = [];
    let els = null;

    // ---------------- facts from the page ----------------
    function facts() {
      const units = state.units;
      const idx = id => units.findIndex(u => u.result && ((u.result.ids || []).includes(id) || u.result.id === id));
      const valueAfter = i => {
        const u = units[i];
        if (/:\s*\S/.test(u.text) && u.result && u.result.status === 'ok') return u.text.split(/:\s*/).slice(1).join(': ');
        for (let k = i + 1; k < Math.min(units.length, i + 4); k++) if (units[k].result && units[k].result.value) return units[k].text;
        return null;
      };
      const val = ids => { for (const id of ids) { const i = idx(id); if (i >= 0) { const v = valueAfter(i); if (v) return v; } } return null; };
      const heading = units.find(u => /^H[1-3]$/.test(u.el.tagName) && u.result && !u.result.value);
      const isButton = u => /^(BUTTON|A)$/.test(u.el.tagName) || u.el.getAttribute('role') === 'button' || (u.el.tagName === 'INPUT' && /submit|button/.test(u.el.type));
      const buttons = units.filter(u => isButton(u) && u.result && !u.result.value);
      const order = ['confirm_transfer', 'confirm', 'continue', 'perform_transfer', 'new_transfer'];
      const main = order.map(id => buttons.find(b => (b.result.ids || []).includes(id) || b.result.id === id)).find(Boolean) || buttons[buttons.length - 1];
      return {
        title: heading ? shownText(heading) : (document.title || '').split(/\s+[|·•–—-]\s+/)[0],
        total: val(['total_debited']),
        amount: val(['amount', 'amount_to_send']),
        fees: val(['step_costs', 'fees', 'transfer_fees', 'transaction_fees']),
        receiver: val(['beneficiary', 'step_beneficiary', 'beneficiary_name']),
        balance: val(['available_balance', 'balance']),
        warnings: units.filter(u => u.result && (u.result.kind === 'warning' || u.result.kind === 'error') && !u.result.value).map(shownText),
        next: main ? `«${shownText(main)}»` : null,
      };
    }

    // ---------------- built-in answers ----------------
    function answer(intent) {
      const f = facts();
      const out = [];
      const say = (id, fr, vars = {}) => out.push(fill(ui(id, fr), vars));
      if (intent === 'page') {
        say('ans_page', 'Cette page : {title}.', { title: f.title || '…' });
        if (f.total || f.amount) say('ans_amount', 'Montant total : {total}.', { total: f.total || f.amount });
        if (f.receiver) say('ans_receiver', "L'argent va à {name}.", { name: f.receiver });
        if (f.balance && !f.total) say('ans_balance', 'Argent disponible : {balance}.', { balance: f.balance });
        if (f.warnings.length) say('ans_warning', 'Attention : {message}', { message: f.warnings[0] });
      } else if (intent === 'amount') {
        if (f.total || f.amount) say('ans_amount', 'Montant total : {total}.', { total: f.total || f.amount });
        if (f.fees) say('ans_fees', 'Frais : {fees}.', { fees: f.fees });
        if (!out.length) say('ans_no_amount', 'Je ne vois pas de montant à payer sur cette page.');
      } else if (intent === 'receiver') {
        if (f.receiver) say('ans_receiver', "L'argent va à {name}.", { name: f.receiver });
        else say('ans_no_receiver', 'Je ne vois pas encore de bénéficiaire sur cette page.');
      } else if (intent === 'warning') {
        if (f.warnings.length) f.warnings.slice(0, 2).forEach(m => say('ans_warning', 'Attention : {message}', { message: m }));
        else say('ans_no_warning', "Pas d'alerte sur cette page.");
      } else if (intent === 'next') {
        if (f.next) say('ans_next', 'Ensuite, appuyez sur {button}.', { button: f.next });
        else say('ans_no_next', 'Je ne vois pas de bouton à appuyer.');
      } else if (intent === 'balance') {
        if (f.balance) say('ans_balance', 'Argent disponible : {balance}.', { balance: f.balance });
        else say('ans_no_amount', 'Je ne vois pas de montant à payer sur cette page.');
      }
      return out.join(' ');
    }

    /** Answer text -> speech steps: words in the national voice, amounts/names read exactly. */
    function stepsOf(text) {
      const m = P.mask(text, { brands: state.brands || [] });
      const steps = [];
      let rest = m.masked;
      for (const t of m.tokens) {
        const [before, after] = rest.split(t.key);
        if (/\p{L}/u.test(before)) steps.push({ missing: true, text: before.trim() });
        steps.push({ value: t.value, type: t.type });
        rest = after || '';
      }
      if (/\p{L}/u.test(rest)) steps.push({ missing: true, text: rest.trim() });
      return player.prepare(steps, voiceOpts());
    }

    /** Numbers in a model's answer must all exist on the page (no invented amounts). */
    function numbersAreFromPage(text) {
      const page = state.units.map(u => u.text).join(' ').replace(/[\s  .,]/g, '');
      return (text.match(/\d[\d\s  .,]*\d|\d/g) || []).every(n => page.includes(n.replace(/[\s  .,]/g, '')));
    }

    async function ask(question, intentHint) {
      const q = String(question || '').trim();
      if (!q) return;
      push({ role: 'me', text: q });
      const intent = intentHint || detectIntent(q);
      if (intent) return reply(answer(intent));
      // Free question: local open-source model, if set up.
      if (state.settings.mt && state.settings.mt.mode === 'openai') {
        const thinking = push({ role: 'bot', text: '…', pending: true });
        const context = state.units.filter(u => u.result).slice(0, 80).map(u => (u.result.value ? u.text : `${shownText(u)} (${u.text})`));
        let res = null;
        try { res = await send({ type: 'chat', lang: state.pack.code, question: q, context }); } catch { res = null; }
        chat.splice(chat.indexOf(thinking), 1);
        if (res && res.text && numbersAreFromPage(res.text)) return reply(res.text, { model: true });
      }
      reply(ui('ans_unknown', 'Je peux répondre à ces questions :'), { chips: true });
    }

    function reply(text, extra = {}) {
      const m = push({ role: 'bot', text, ...extra });
      if (state.settings.autoRead || extra.spoken) {
        const steps = stepsOf(text);
        if (steps) player.play(steps);
      }
      return m;
    }

    function push(m) { chat.push(m); render(); return m; }

    // ---------------- voice questions ----------------
    let rec = null;
    async function listen() {
      const asr = (state.settings && state.settings.asr) || {};
      if (rec) { rec.stop(); return; }
      if (asr.mode === 'local') return listenLocal();
      const SR = root.SpeechRecognition || root.webkitSpeechRecognition;
      if (!SR) return reply(ui('ans_type_instead', 'Écrivez votre question ou touchez une question ci-dessous.'));
      if (!state.settings.onlineSpeech) return askSpeechConsent(() => listenBrowser(SR));
      listenBrowser(SR);
    }

    function listenBrowser(SR) {
      const code = state.pack.code;
      const base = /^en/i.test(navigator.language || '') ? 'en-US' : 'fr-FR';
      const lang = code === 'wes' ? 'en-NG' : base;
      const r = new SR();
      r.lang = lang;
      r.interimResults = false;
      r.maxAlternatives = 1;
      rec = { stop: () => r.stop() };
      setMic(true);
      r.onresult = e => { const t = e.results[0][0].transcript; ask(t); };
      r.onerror = () => {};
      r.onend = () => { rec = null; setMic(false); };
      r.start();
    }

    async function listenLocal() {
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { return reply(ui('ans_type_instead', 'Écrivez votre question ou touchez une question ci-dessous.')); }
      const chunks = [];
      const mr = new MediaRecorder(stream);
      rec = { stop: () => mr.state !== 'inactive' && mr.stop() };
      setMic(true);
      const timer = setTimeout(() => rec && rec.stop(), 12000);
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = async () => {
        clearTimeout(timer);
        stream.getTracks().forEach(t => t.stop());
        rec = null;
        setMic(false);
        const wav = await toWav16k(new Blob(chunks, { type: mr.mimeType }));
        const thinking = push({ role: 'bot', text: '…', pending: true });
        let res = null;
        try { res = await send({ type: 'asr', audio: wav, hint: state.pack.code }); } catch { res = null; }
        chat.splice(chat.indexOf(thinking), 1);
        if (!res || !res.text) { reply(ui('ans_type_instead', 'Écrivez votre question ou touchez une question ci-dessous.')); return; }
        if (res.lang && res.lang !== state.pack.code && state.langs && state.langs[res.lang]) offerLanguage(res.lang);
        ask(res.text);
      };
      mr.start();
    }

    /** Recording -> 16 kHz mono WAV (base64), the format the open-source speech models expect. */
    async function toWav16k(blob) {
      const buf = await blob.arrayBuffer();
      const ac = new (root.AudioContext || root.webkitAudioContext)();
      const decoded = await ac.decodeAudioData(buf);
      ac.close();
      const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
      const src = off.createBufferSource();
      src.buffer = decoded; src.connect(off.destination); src.start();
      const pcm = (await off.startRendering()).getChannelData(0);
      const out = new DataView(new ArrayBuffer(44 + pcm.length * 2));
      const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
      w(0, 'RIFF'); out.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true);
      out.setUint16(20, 1, true); out.setUint16(22, 1, true); out.setUint32(24, 16000, true); out.setUint32(28, 32000, true);
      out.setUint16(32, 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, pcm.length * 2, true);
      for (let i = 0; i < pcm.length; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, pcm[i])) * 0x7fff, true);
      let bin = '';
      const bytes = new Uint8Array(out.buffer);
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(bin);
    }

    /** The speaker used another language than the one set: offer to switch, one tap. */
    function offerLanguage(code) {
      const name = state.langs[code].name;
      push({ role: 'bot', text: fill(ui('ans_lang_detected', 'Vous parlez {lang} ?'), { lang: name }), action: { label: fill(ui('ui_switch_to', 'Passer en {lang}'), { lang: name }), run: async () => {
        const cur = await send({ type: 'getSettings' });
        await api.storage.local.set({ settings: { ...cur, lang: code } });
      } } });
    }

    function askSpeechConsent(then) {
      push({ role: 'bot', text: ui('ans_speech_consent', 'Pour comprendre votre voix, le navigateur envoie l’enregistrement au service de reconnaissance de Google (français, anglais, pidgin).'), action: { label: ui('ui_enable', 'Activer'), run: () => { setLight({ onlineSpeech: true }); then(); } } });
    }

    function setMic(on) { if (els) { els.mic.classList.toggle('on', on); els.mic.setAttribute('aria-pressed', on); els.input.placeholder = on ? ui('ui_listening', 'J’écoute…') : ui('ui_ask_placeholder', 'Posez votre question…'); } }

    // ---------------- view ----------------
    const QUESTIONS = [
      ['page', 'q_page', 'C’est quoi cette page ?'],
      ['amount', 'q_amount', 'Combien je vais payer ?'],
      ['receiver', 'q_receiver', 'Qui reçoit l’argent ?'],
      ['warning', 'q_warning', 'Y a-t-il un danger ?'],
      ['next', 'q_next', 'Je fais quoi maintenant ?'],
    ];

    function mount() {
      const log = h('div', { class: 'log', 'aria-live': 'polite' });
      const chips = h('div', { class: 'qchips' }, QUESTIONS.map(([intent, id, fr]) => h('button', { type: 'button', class: 'qchip', onclick: () => ask(ui(id, fr), intent) }, ui(id, fr))));
      const input = h('input', { type: 'text', class: 'askin', placeholder: ui('ui_ask_placeholder', 'Posez votre question…'), 'aria-label': ui('ui_ask_placeholder', 'Posez votre question…'), enterkeyhint: 'send' });
      const mic = h('button', { type: 'button', class: 'mic', title: ui('ui_mic', 'Parler'), 'aria-label': ui('ui_mic', 'Parler'), onclick: listen }, icon('mic'));
      const sendBtn = h('button', { type: 'submit', class: 'sendq', 'aria-label': ui('ui_send', 'Envoyer') }, icon('send'));
      const form = h('form', { class: 'askrow' }, mic, input, sendBtn);
      form.addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; ask(v); });
      input.addEventListener('keydown', e => e.stopPropagation()); // typing never triggers page shortcuts
      const view = h('div', { class: 'chat' }, log, chips, form);
      els = { view, log, chips, input, mic };
      render();
      return view;
    }

    function render() {
      if (!els) return;
      if (!chat.length) chat.push({ role: 'bot', text: ui('ans_welcome', 'Bonjour ! Posez-moi une question sur cette page, en écrivant ou à voix haute.') });
      els.log.replaceChildren(...chat.map(m => {
        if (m.role === 'me') return h('div', { class: 'msg me' }, m.text);
        const steps = !m.pending && stepsOf(m.text);
        return h('div', { class: `msg bot${m.pending ? ' pending' : ''}` },
          h('div', { class: 'mrow' }, h('div', { class: 'mtext' }, m.pending ? h('span', { class: 'dots' }, h('i'), h('i'), h('i')) : m.text),
            steps ? ctx.sayButton(steps, ui('ui_listen', 'Écouter'), { compact: true }) : null),
          m.model ? h('div', { class: 'mnote' }, ui('ans_model_note', 'Réponse d’un modèle local, à vérifier.')) : null,
          m.action ? h('button', { class: 'maction', type: 'button', onclick: e => { e.stopPropagation(); m.action.run(); m.action = null; render(); } }, m.action.label) : null);
      }));
      els.log.scrollTop = els.log.scrollHeight;
    }

    return { mount, render, ask, reset: () => { chat.length = 0; render(); } };
  }

  root.LangwaAssistant = { create, detectIntent };
  if (typeof module !== 'undefined' && module.exports) module.exports = { detectIntent };
})(typeof globalThis !== 'undefined' ? globalThis : this);

/*
 * Langwa: standalone runtime.
 * Lets the same content script run WITHOUT the extension APIs: as a userscript on phones
 * (Tampermonkey / Violentmonkey on Android, the "Userscripts" app in Safari on iPhone) or any
 * browser that has no extension support. Language data is embedded by tools/build.mjs in
 * globalThis.LANGWA_DATA. Settings are kept in the userscript manager's own storage when
 * available (GM_getValue), otherwise only for the current page.
 */
(function (root) {
  'use strict';
  const D = root.LANGWA_DATA;
  if (!D) return;

  const hasGM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';
  const mem = {};
  const store = {
    get: k => (hasGM ? GM_getValue(k, undefined) : mem[k]),
    set: (k, v) => (hasGM ? GM_setValue(k, v) : (mem[k] = v)),
    del: k => (hasGM && typeof GM_deleteValue === 'function' ? GM_deleteValue(k) : delete mem[k]),
  };
  const listeners = [];

  // Translated phrases per language (the chooser marks empty languages "Soon").
  const count = code => Object.values((D.packs[code] || {}).entries || {}).filter(e => e && e.t).length;
  const langs = () => Object.fromEntries(Object.entries(D.langs).map(([c, l]) => [c, { ...l, count: count(c) }]));

  function settings() {
    const s = store.get('settings') || {};
    const here = location.protocol === 'file:' ? 'file://' : location.origin;
    return {
      lang: null, hover: 'ctrl', // language chosen by the user on first use toasts: true, autoSpeak: true,
      mt: { mode: 'none' }, tts: { mode: 'none' },
      ...s,
      sites: [here], // the userscript manager already decides on which sites it runs
    };
  }

  function pack(code) {
    const file = (code && (D.packs[code] || {}).entries) || {};
    const over = (code && store.get(`overrides:${code}`)) || {};
    const l = D.langs[code] || {};
    return {
      code, name: l.name || code || '', mms: null, africaTts: null, voices: l.voices || null, reading: l.reading || null,
      lexicon: code && D.lexicon ? { fr: (D.lexicon.fr || {})[code] || {}, en: (D.lexicon.en || {})[code] || {} } : null,
      entries: D.source.entries.map(e => {
        const tr = { ...file[e.id], ...over[e.id] };
        return { ...e, t: tr.t || '', x: tr.x || '', verified: !!tr.verified, audio: tr.audio || '', audioParts: tr.audioParts || [] };
      }),
    };
  }

  const handlers = {
    getSettings: () => settings(),
    getLangs: () => langs(),
    getPack: m => pack(m.lang !== undefined ? m.lang : settings().lang),
    translateBatch: m => ({ results: (m.items || []).map(() => null), error: null }),
    tts: () => null,
    clearCache: () => true,
  };

  root.LangwaRuntime = {
    runtime: {
      sendMessage: async msg => (handlers[msg && msg.type] || (() => null))(msg || {}),
      onMessage: { addListener() {} },
    },
    storage: {
      local: {
        async get(key) {
          const keys = key == null ? [] : Array.isArray(key) ? key : [key];
          return Object.fromEntries(keys.map(k => [k, store.get(k)]));
        },
        async set(obj) {
          const changes = {};
          for (const [k, v] of Object.entries(obj)) { changes[k] = { oldValue: store.get(k), newValue: v }; store.set(k, v); }
          setTimeout(() => listeners.forEach(fn => fn(changes, 'local')), 0);
        },
        async remove(key) { for (const k of [].concat(key)) store.del(k); },
      },
      onChanged: { addListener: fn => listeners.push(fn) },
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

/*
 * Langwa: content script.
 *
 * Reads the page, never changes it: no text, attribute, style or form value of the financial
 * service is modified. Everything is drawn in one isolated Shadow DOM layer:
 *   - Ctrl + hover card (translation below the element, 🔊, protected values, status)
 *   - reading panel (whole page, important messages first)
 *   - alerts for new errors / warnings / confirmations
 *   - subtitles under every element
 * Performance: one coalesced, idle-time rescan per burst of DOM changes; weak references to
 * page elements; bounded caches; listeners only on sites where the extension is enabled.
 */
(() => {
  'use strict';
  if (window.__langwa) return;
  window.__langwa = true;

  // Extension APIs, or the standalone runtime when running as a userscript on phones.
  const api = globalThis.LangwaRuntime ?? globalThis.browser ?? globalThis.chrome;
  const P = globalThis.LangwaProtect;
  const E = globalThis.LangwaEngine;

  const SKIP = 'script,style,noscript,textarea,code,pre,svg,template,iframe,canvas,[contenteditable=""],[contenteditable="true"],langwa-root';
  const ATTRS = ['placeholder', 'aria-label', 'title'];
  const NEW_AFTER_MS = 1500;
  /** Texts already seen on this site during this session (survives language changes and restarts). */
  const seenTexts = new Set();
  const ALERT_KINDS = new Set(['error', 'warning', 'success']);

  const state = {
    active: false,
    settings: null,
    pack: null,
    engine: null,
    ui: new Map(),             // interface strings in the national language (glossary group "ui")
    units: [],                 // visible units, document order
    unitsByEl: new Map(),      // Element -> unit[] (current scan only)
    known: new WeakMap(),      // Element -> unit[] (weak: removed elements are garbage-collected)
    results: new Map(),        // text+literals -> Promise<result> (bounded LRU)
    literals: new Set(),       // values typed by the user during this page session (never stored)
    gen: 0,                    // start() generation, guards against overlapping restarts
    mtError: false,
    pending: 0,
    stats: { ms: 0, count: 0 },
    startedAt: 0,
    panelOpen: false,
    subtitles: false,
  };

  /** Interface text: national-language version when the speaker has translated it, else French. */
  const ui = (id, fr) => state.ui.get(id) || fr;
  /** Base interface language: the browser's (French or English), until the national language is translated. */
  const BASE = /^en/i.test(navigator.language || '') ? 'en' : 'fr';
  /** Interface strings: national-language translation, else French/English from the browser. */
  const uiMap = pack => new Map(pack.entries.filter(e => e.group === 'ui').map(e => [e.id, e.t || (BASE === 'en' ? e.en : e.fr)]));
  /** Phones and tablets: no Ctrl key, no hover -> long press shows the card. */
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

  // ======================================================================================
  // UI layer
  // ======================================================================================
  let pageBtn = null;
  let assistant = null;
  let tabsBar = null;
  let tabCount = null;
  let views = {};
  /** Assistant first; the choice is remembered for the session. */
  function setTab(id) {
    state.tab = id;
    for (const [k, v] of Object.entries(views)) v.hidden = k !== id;
    if (tabsBar) for (const b of tabsBar.children) { const on = b.dataset.tab === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }
    if (id === 'list') renderPanel();
  }
  let host, shadow, tip, tipBody, tipArrow, panel, panelList, panelStatus, toastBox, hl, subLayer, fab, fabDot, fabCount;

  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : String(kid));
    return el;
  }

  /*
   * Theme: warm ebony and ivory surfaces, kente gold accent, forest green for
   * validated/listen, terracotta for errors, indigo for information. A thin kente-stripe band
   * is the signature. All colours meet WCAG AA contrast on their surfaces.
   */
  const CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; margin: 0; font-family: "Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, Roboto, "Noto Sans", sans-serif; }
  button { cursor: pointer; font: inherit; color: inherit; }
  :focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }
  svg.i { width: 1em; height: 1em; flex: none; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; vertical-align: -.15em; }
  svg.i.fill { fill: currentColor; stroke: none; }

  .layer {
    --ebony: #1d1712; --ebony-2: #2a221b; --ebony-3: #3d3229; --ivory: #fbf6ee; --sand: #d9c9b4;
    --gold: #e3a21a; --gold-soft: #f6dfa6; --forest: #1e7a4c; --forest-2: #2f9e66; --terracotta: #c2502e; --indigo: #3d4a8a; --indigo-2: #8fa0e6;
    --card: #fffcf7; --card-fg: #241d16; --card-muted: #76675a; --line: #ebdfcd; --soft: #f6eee2;
    --kente: repeating-linear-gradient(90deg, #e3a21a 0 18px, #1e7a4c 18px 24px, #c2502e 24px 36px, #1d1712 36px 40px, #e3a21a 40px 46px, #3d4a8a 46px 52px);
  }
  @media (prefers-color-scheme: dark) {
    .layer { --card: #1f1913; --card-fg: #f6efe4; --card-muted: #b7a690; --line: #3a3027; --soft: #2a221b; }
  }

  /* ---------- hover card ---------- */
  .tip { position: fixed; z-index: 2147483647; width: max-content; max-width: min(440px, calc(100vw - 16px));
    background: var(--ebony); color: var(--ivory); border-radius: 16px; padding: 14px 16px;
    box-shadow: 0 20px 50px rgba(20,12,4,.45), 0 0 0 1px rgba(255,240,220,.07);
    font-size: 15px; line-height: 1.42; visibility: hidden; opacity: 0; transform: translateY(4px);
    transition: opacity .14s ease, transform .14s ease, visibility 0s .14s; }
  .tip.show { visibility: visible; opacity: 1; transform: none; transition: opacity .14s ease, transform .14s ease; }
  .tip.passthru { pointer-events: none; }
  .arrow { position: absolute; width: 14px; height: 14px; background: var(--ebony); transform: rotate(45deg); top: -6px; border-radius: 3px; }
  .tip.above .arrow { top: auto; bottom: -6px; }
  .block + .block { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--ebony-3); }
  .tr .i.kind { margin-right: 7px; }
  .tr .i.err { color: #ec8a6c; } .tr .i.warn { color: var(--gold); } .tr .i.okk { color: #6fd29d; }
  .tr.missing { font-size: 15px; font-weight: 600; color: var(--sand); }
  .row { display: flex; align-items: flex-start; gap: 12px; }
  .tr { flex: 1; font-size: 19px; font-weight: 650; letter-spacing: -.005em; overflow-wrap: anywhere; }
  .tr .i { color: var(--sand); margin-right: 6px; }
  .explain { display: flex; gap: 8px; margin-top: 7px; font-size: 14px; color: #efe3d1; }
  .explain .i { color: var(--gold); margin-top: 2px; }
  .orig { margin-top: 7px; font-size: 13px; color: var(--sand); opacity: .85; overflow-wrap: anywhere; }
  .orig b { font-size: 9.5px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; margin-right: 7px; opacity: .7; }
  .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 10px; }
  .chip { display: inline-flex; align-items: center; gap: 5px; font: 700 13px "Cascadia Mono", ui-monospace, Consolas, monospace;
    background: var(--gold-soft); color: #3b2604; padding: 3px 8px; border-radius: 8px; }
  .chip .i { font-size: 12px; }
  .pill { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; padding: 3px 9px 3px 7px; border-radius: 999px; }
  .pill.ok { background: rgba(47,158,102,.18); color: #7fd9a8; } .pill.mt { background: rgba(227,162,26,.18); color: #f3c460; }
  .pill.gist { background: rgba(143,160,230,.18); color: #b9c5f3; } .pill.block { background: rgba(194,80,46,.22); color: #f2a58d; }
  .pill.none { background: rgba(217,201,180,.14); color: var(--sand); }
  .skeleton { height: 18px; width: 220px; border-radius: 6px; background: linear-gradient(90deg, var(--ebony-2), var(--ebony-3), var(--ebony-2)); background-size: 200% 100%; animation: shimmer 1.1s linear infinite; }
  @keyframes shimmer { to { background-position: -200% 0; } }
  .spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }

  /* listen button */
  .say.wide { width: auto; height: 40px; padding: 0 14px 0 12px; display: inline-flex; gap: 8px; align-items: center; font-size: 18px; }
  .say .lbl { font-size: 14px; font-weight: 700; white-space: nowrap; }
  .bars { display: inline-flex; align-items: flex-end; gap: 2px; height: 16px; }
  .bars i { width: 3px; height: 6px; border-radius: 2px; background: currentColor; animation: eq .8s ease-in-out infinite; }
  .bars i:nth-child(2) { animation-delay: .15s; } .bars i:nth-child(3) { animation-delay: .3s; }
  @keyframes eq { 50% { height: 16px; } }
  .voice { display: flex; align-items: center; gap: 6px; margin-top: 6px; font-size: 12px; color: var(--sand); opacity: .85; }
  /* Voice chip: who is speaking, live (local model, browser voice, human recording). */
  .vchip { --c: var(--sand); display: inline-flex; align-items: center; gap: 7px; max-width: 100%; margin-top: 9px; padding: 4px 11px 4px 9px;
    border-radius: 999px; font-size: 12px; font-weight: 600; line-height: 1.3; color: var(--c);
    background: color-mix(in srgb, var(--c) 13%, transparent); border: 1px solid color-mix(in srgb, var(--c) 30%, transparent);
    transition: color .2s ease, background .2s ease, border-color .2s ease; }
  .vchip .i { font-size: 14px; flex: none; }
  .vchip .vt { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .vchip .why { font-weight: 500; opacity: .8; }
  .vchip .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex: none; display: none; }
  .vchip.live .dot { display: block; animation: pulse 1.1s ease-in-out infinite; }
  .vchip[data-src="local"], .vchip[data-src="wait"] { --c: #7fe0ad; }
  .vchip[data-src="browser"] { --c: var(--indigo-2); }
  .vchip[data-src="human"] { --c: var(--gold); }
  .vchip[data-src="wait"] .i { animation: spin 1s linear infinite; }
  .item .vchip { --c: var(--card-muted); }
  .item .vchip[data-src="local"], .item .vchip[data-src="wait"] { --c: color-mix(in srgb, var(--forest) 75%, var(--card-fg)); }
  .item .vchip[data-src="browser"] { --c: color-mix(in srgb, var(--indigo) 70%, var(--card-fg)); }
  .item .vchip[data-src="human"] { --c: color-mix(in srgb, #b07a0a 80%, var(--card-fg)); }
  .voice .i { font-size: 13px; }
  .item .voice { color: var(--card-muted); }
  .say { flex: none; width: 42px; height: 42px; border-radius: 999px; border: 0; display: grid; place-items: center; font-size: 20px;
    background: var(--forest); color: #fff; box-shadow: 0 4px 14px rgba(30,122,76,.45); transition: transform .1s ease, background .15s ease; }
  .say:hover { transform: scale(1.06); background: var(--forest-2); }
  .say:active { transform: scale(.95); }
  .say.on { background: var(--terracotta); animation: ring 1.2s ease-out infinite; }
  .say:disabled { background: var(--ebony-3); color: #9c8b78; box-shadow: none; cursor: not-allowed; transform: none; }
  @keyframes ring { from { box-shadow: 0 0 0 0 rgba(194,80,46,.55); } to { box-shadow: 0 0 0 12px rgba(194,80,46,0); } }

  .consent { margin-top: 12px; padding: 10px 12px; border-radius: 12px; background: var(--ebony-2); border: 1px solid var(--ebony-3); font-size: 13px; color: var(--sand); }
  .consent b { color: var(--ivory); }
  .cbtns { display: flex; gap: 8px; margin-top: 8px; }
  .cbtns button { border: 0; border-radius: 9px; padding: 7px 12px; font-weight: 700; font-size: 13px; }
  .cyes { background: var(--gold); color: var(--ebony); } .cno { background: transparent; color: var(--sand); box-shadow: inset 0 0 0 1px var(--ebony-3) !important; }
  .item .consent { background: var(--soft); border-color: var(--line); color: var(--card-muted); } .item .consent b { color: var(--card-fg); }
  /* ---------- tabs ---------- */
  .tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 8px 12px; background: var(--card); border-bottom: 1px solid var(--line); }
  .tab { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 9px 10px; border: 0; border-radius: 12px; background: transparent; color: var(--card-muted); font-weight: 700; font-size: 14px; }
  .tab .i { font-size: 17px; }
  .tab.on { background: var(--ebony); color: var(--ivory); } .tab.on .i { color: var(--gold); }
  .tcount { display: none; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 99px; background: var(--terracotta); color: #fff; font-size: 11.5px; font-weight: 800; place-items: center; }
  .tcount.show { display: inline-grid; }

  /* ---------- assistant chat ---------- */
  .chat { display: flex; flex-direction: column; min-height: 0; flex: 1; }
  .chat[hidden], .list[hidden] { display: none; }
  .log { flex: 1; min-height: 160px; overflow-y: auto; padding: 14px 14px 6px; display: flex; flex-direction: column; gap: 10px; overscroll-behavior: contain; }
  .msg { max-width: 86%; padding: 10px 13px; border-radius: 16px; font-size: 15px; line-height: 1.45; overflow-wrap: anywhere; }
  .msg.me { align-self: flex-end; background: var(--ebony); color: var(--ivory); border-bottom-right-radius: 5px; }
  .msg.bot { align-self: flex-start; background: var(--soft); color: var(--card-fg); border: 1px solid var(--line); border-bottom-left-radius: 5px; }
  .mrow { display: flex; gap: 10px; align-items: flex-start; }
  .mtext { flex: 1; }
  .msg .say { width: 32px; height: 32px; font-size: 15px; box-shadow: none; }
  .mnote { margin-top: 6px; font-size: 11.5px; color: var(--card-muted); }
  .maction { margin-top: 8px; border: 0; border-radius: 10px; padding: 7px 12px; background: var(--gold); color: var(--ebony); font-weight: 800; font-size: 13px; }
  .dots { display: inline-flex; gap: 4px; } .dots i { width: 6px; height: 6px; border-radius: 99px; background: var(--card-muted); animation: pulse 1s infinite; }
  .dots i:nth-child(2) { animation-delay: .2s; } .dots i:nth-child(3) { animation-delay: .4s; }
  .qchips { display: flex; gap: 8px; overflow-x: auto; padding: 8px 14px; scrollbar-width: none; }
  .qchips::-webkit-scrollbar { display: none; }
  .qchip { flex: none; border: 1px solid var(--line); background: var(--card); color: var(--card-fg); border-radius: 99px; padding: 8px 13px; font-size: 13.5px; font-weight: 600; }
  .qchip:hover { border-color: var(--gold); }
  .askrow { display: flex; gap: 8px; align-items: center; padding: 8px 12px 12px; }
  .askin { flex: 1; min-width: 0; height: 44px; border: 1px solid var(--line); border-radius: 22px; padding: 0 16px; font: inherit; font-size: 15px; background: var(--card); color: var(--card-fg); }
  .askin:focus { outline: 2px solid var(--gold); border-color: transparent; }
  .mic, .sendq { flex: none; width: 44px; height: 44px; border-radius: 99px; border: 0; display: grid; place-items: center; font-size: 19px; }
  .mic { background: var(--forest); color: #fff; }
  .mic.on { background: var(--terracotta); animation: ring 1.2s ease-out infinite; }
  .sendq { background: var(--ebony); color: var(--gold); }
  .item .say.wide { width: auto; height: 36px; padding: 0 12px 0 10px; }
  .list { overflow-x: hidden; }

  .words { margin-top: 10px; }
  .words .wl { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; letter-spacing: .03em; color: var(--sand); margin-bottom: 6px; }
  .wchips { display: flex; flex-wrap: wrap; gap: 6px; }
  .wchip { display: inline-flex; align-items: baseline; gap: 6px; padding: 4px 9px; border-radius: 9px; background: var(--ebony-2); border: 1px solid var(--ebony-3); font-size: 13.5px; }
  .wchip b { font-weight: 700; color: var(--ivory); } .wchip i { font-style: normal; font-size: 11.5px; color: var(--sand); }
  .item .words .wl { color: var(--card-muted); }
  .item .wchip { background: var(--soft); border-color: var(--line); } .item .wchip b { color: var(--card-fg); } .item .wchip i { color: var(--card-muted); }

  /* ---------- floating button ---------- */
  .fab { position: fixed; right: 18px; bottom: 18px; z-index: 2147483646; display: flex; align-items: center; gap: 10px;
    border: 0; border-radius: 999px; padding: 8px 18px 8px 8px; background: var(--ebony); color: var(--ivory); font-weight: 700; font-size: 15px;
    box-shadow: 0 12px 30px rgba(20,12,4,.38), 0 0 0 1px rgba(255,240,220,.08); transition: transform .12s ease, box-shadow .12s ease; }
  .fab:hover { transform: translateY(-2px); box-shadow: 0 16px 34px rgba(20,12,4,.42), 0 0 0 2px var(--gold); }
  .fab .logo { width: 34px; height: 34px; border-radius: 999px; display: grid; place-items: center; background: var(--gold); color: var(--ebony); font-size: 18px; position: relative; }
  .dot { position: absolute; right: -2px; bottom: -2px; width: 12px; height: 12px; border-radius: 99px; border: 2px solid var(--ebony); background: var(--forest-2); }
  .dot.busy { background: var(--ivory); animation: pulse 1s ease-in-out infinite; } .dot.warn { background: var(--terracotta); }
  @keyframes pulse { 50% { opacity: .3; } }
  .count { min-width: 22px; height: 22px; padding: 0 6px; border-radius: 99px; background: var(--terracotta); color: #fff; font-size: 12px; font-weight: 800; display: none; place-items: center; }
  .count.show { display: grid; }

  /* ---------- panel ---------- */
  .panel { position: fixed; right: 18px; bottom: 82px; z-index: 2147483646; width: min(420px, calc(100vw - 36px)); max-height: min(72vh, 680px);
    background: var(--card); color: var(--card-fg); border-radius: 20px; box-shadow: 0 24px 60px rgba(20,12,4,.32), 0 0 0 1px var(--line);
    display: flex; flex-direction: column; overflow: hidden; visibility: hidden; opacity: 0; transform: translateY(10px) scale(.98); transform-origin: bottom right;
    transition: opacity .16s ease, transform .16s ease, visibility 0s .16s; }
  .panel.show { visibility: visible; opacity: 1; transform: none; transition: opacity .16s ease, transform .16s ease; }
  .panel { height: min(72vh, 680px); }
  .band { height: 6px; background: var(--kente); flex: none; }
  .ph { display: flex; align-items: center; gap: 10px; padding: 14px 14px 12px 16px; background: var(--ebony); color: var(--ivory); }
  .ph .logo { width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; background: var(--gold); color: var(--ebony); font-size: 19px; flex: none; }
  .ph .title { flex: 1; min-width: 0; }
  .ph .lang { font-size: 17px; font-weight: 800; letter-spacing: .01em; }
  .lang-select { appearance: none; -webkit-appearance: none; border: 0; border-radius: 8px; padding: 2px 24px 2px 6px; margin-left: -6px; max-width: 100%;
    color: var(--ivory); cursor: pointer; background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e3a21a' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 4px center / 16px; }
  .lang-select:hover { background-color: var(--ebony-2); }
  .lang-select option { color: #241d16; background: #fffcf7; }
  .status { font-size: 12.5px; color: var(--sand); margin-top: 2px; display: flex; flex-wrap: wrap; gap: 4px 12px; }
  .status span { display: inline-flex; align-items: center; gap: 4px; }
  .status .ok { color: #7fd9a8; } .status .mt { color: #f3c460; } .status .gist { color: #b9c5f3; } .status .block, .status .warn { color: #f2a58d; }
  .icon-btn { width: 38px; height: 38px; border-radius: 12px; border: 1px solid var(--ebony-3); background: var(--ebony-2); color: var(--ivory); display: grid; place-items: center; font-size: 18px; }
  .icon-btn:hover { border-color: var(--gold); }
  .icon-btn.on { background: var(--gold); color: var(--ebony); border-color: var(--gold); }
  .list { overflow: auto; padding: 4px 16px 16px; overscroll-behavior: contain; }
  .sec { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; color: var(--card-muted); margin: 16px 2px 10px; }
  .sec .n { margin-left: auto; font-size: 11px; font-weight: 700; letter-spacing: 0; padding: 1px 8px; border-radius: 99px; background: var(--soft); color: var(--card-muted); }
  .sec.alert { color: var(--terracotta); }
  .sec.alert .n { background: color-mix(in srgb, var(--terracotta) 12%, var(--card)); color: var(--terracotta); }
  .item { display: block; width: 100%; text-align: left; padding: 14px 16px; border-radius: 14px; border: 1px solid var(--line); background: var(--card); margin-bottom: 10px;
    box-shadow: 0 1px 2px rgba(36,29,22,.05); transition: border-color .12s ease, box-shadow .12s ease; }
  .item:hover { border-color: color-mix(in srgb, var(--gold) 55%, var(--line)); box-shadow: 0 6px 16px rgba(36,29,22,.08); }
  .item.k-error { border-color: color-mix(in srgb, var(--terracotta) 30%, var(--line)); background: color-mix(in srgb, var(--terracotta) 6%, var(--card)); }
  .item.k-warning { border-color: color-mix(in srgb, var(--gold) 40%, var(--line)); background: color-mix(in srgb, var(--gold) 8%, var(--card)); }
  .item .row { gap: 14px; }
  .item .tr { font-size: 16px; font-weight: 650; line-height: 1.45; color: var(--card-fg); }
  .item .tr.plain { font-weight: 500; }
  .item .tr .i { color: var(--card-muted); }
  .item .tr .i.err { color: var(--terracotta); } .item .tr .i.warn { color: #b57d00; } .item .tr .i.okk { color: var(--forest); }
  .item .orig { margin-top: 8px; font-size: 13px; line-height: 1.45; color: var(--card-muted); opacity: 1; }
  .item .explain { margin-top: 8px; color: var(--card-fg); } .item .explain .i { color: #b57d00; }
  .item .meta { margin-top: 12px; }
  .item .say { width: 38px; height: 38px; font-size: 18px; }
  .item .chip { background: var(--gold-soft); }
  .item .pill.ok { background: rgba(30,122,76,.12); color: var(--forest); } .item .pill.mt { background: rgba(227,162,26,.16); color: #8a5a00; }
  .item .pill.gist { background: rgba(61,74,138,.12); color: var(--indigo); } .item .pill.block { background: rgba(194,80,46,.14); color: #9b3517; }
  .item .pill.none { background: var(--soft); color: var(--card-muted); }
  .new { display: inline-block; vertical-align: 2px; font-size: 10.5px; font-weight: 800; letter-spacing: .06em; background: var(--terracotta); color: #fff; border-radius: 6px; padding: 2px 6px; margin-right: 8px; }
  .empty { display: grid; place-items: center; gap: 8px; text-align: center; color: var(--card-muted); padding: 32px 12px; font-size: 14px; }
  .empty .i { font-size: 34px; color: var(--gold); }
  .pf { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-top: 1px solid var(--line); font-size: 12.5px; color: var(--card-muted); }
  kbd { font: 700 11.5px "Cascadia Mono", ui-monospace, Consolas, monospace; border: 1px solid var(--line); border-bottom-width: 3px; border-radius: 7px; padding: 2px 7px; background: var(--soft); color: var(--card-fg); }

  /* ---------- alerts ---------- */
  .toasts { position: fixed; left: 50%; transform: translateX(-50%); top: 16px; z-index: 2147483647; display: grid; gap: 10px; width: min(540px, calc(100vw - 24px)); }
  .toast { position: relative; overflow: hidden; background: var(--ebony); color: var(--ivory); border-radius: 16px; padding: 18px 16px 18px;
    box-shadow: 0 20px 50px rgba(20,12,4,.45); animation: drop .22s cubic-bezier(.2,.9,.3,1.2); }
  .toast::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 5px; background: var(--kente); }
  .toast .x { position: absolute; top: 12px; right: 8px; width: 30px; height: 30px; border: 0; border-radius: 8px; background: transparent; color: var(--sand); font-size: 17px; display: grid; place-items: center; }
  .toast .x:hover { background: var(--ebony-3); color: #fff; }
  .toast .bar { position: absolute; left: 0; bottom: 0; height: 4px; background: var(--indigo-2); animation: shrink 10s linear forwards; }
  .toast.k-error .bar { background: var(--terracotta); } .toast.k-warning .bar { background: var(--gold); } .toast.k-success .bar { background: var(--forest-2); }
  .toast:hover .bar { animation-play-state: paused; }
  .toast .block { margin-right: 30px; }
  @keyframes drop { from { opacity: 0; transform: translateY(-12px) scale(.98); } }
  @keyframes shrink { from { width: 100%; } to { width: 0; } }

  /* ---------- page highlight, subtitles, first-run hint ---------- */
  .hl { position: fixed; z-index: 2147483645; border: 3px solid var(--gold); border-radius: 10px; pointer-events: none; display: none;
    box-shadow: 0 0 0 6px rgba(227,162,26,.22); transition: all .08s ease; }
  .hl.pulse { animation: locate .9s ease-out 2; }
  @keyframes locate { 50% { box-shadow: 0 0 0 14px rgba(227,162,26,.06); } }
  .subs { position: fixed; inset: 0; pointer-events: none; z-index: 2147483644; }
  .sub { position: fixed; padding: 0 2px; border-radius: 4px; box-sizing: border-box; overflow-wrap: anywhere;
    text-decoration: underline dotted rgba(227,162,26,.75); text-decoration-thickness: 1.5px; text-underline-offset: 3px; }

  .hint { position: fixed; right: 18px; bottom: 86px; z-index: 2147483647; width: min(330px, calc(100vw - 36px)); background: var(--ebony); color: var(--ivory);
    border-radius: 18px; padding: 22px 18px 16px; box-shadow: 0 20px 50px rgba(20,12,4,.45); animation: drop .3s ease; overflow: visible; }
  .hint::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 6px; border-radius: 18px 18px 0 0; background: var(--kente); }
  .hint::after { content: ""; position: absolute; right: 44px; bottom: -7px; width: 14px; height: 14px; background: var(--ebony); transform: rotate(45deg); border-radius: 3px; }
  .hint .demo { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 4px 0 12px; font-size: 24px; color: var(--sand); }
  .hint kbd { font-size: 15px; padding: 6px 12px; background: var(--ivory); color: var(--ebony); border-color: var(--sand); animation: press 1.6s ease-in-out infinite; }
  .hint .bubble { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; background: var(--gold); color: var(--ebony); }
  @keyframes press { 40%, 60% { transform: translateY(2px); border-bottom-width: 1px; } }
  .hint .line { display: flex; align-items: center; gap: 10px; font-size: 14.5px; margin-top: 10px; }
  .hint .say { width: 32px; height: 32px; font-size: 16px; box-shadow: none; }
  .hint .ok { margin-top: 16px; width: 100%; border: 0; border-radius: 12px; padding: 11px; background: var(--gold); color: var(--ebony); font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .hint .ok:hover { filter: brightness(1.06); }
  /* ---------- first-use language chooser ---------- */
  .chooser { position: fixed; right: 18px; bottom: 18px; z-index: 2147483647; width: min(400px, calc(100vw - 24px)); max-height: calc(100vh - 36px); overflow: auto;
    background: var(--ebony); color: var(--ivory); border-radius: 20px; padding: 24px 16px 12px; box-shadow: 0 24px 60px rgba(20,12,4,.45); animation: drop .3s ease; }
  .chooser::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 6px; border-radius: 20px 20px 0 0; background: var(--kente); }
  .chooser[hidden], .fab[hidden] { display: none; }
  .chooser .head { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; }
  .chooser .logo { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; background: var(--gold); color: var(--ebony); font-size: 22px; flex: none; }
  .chooser h3 { font-size: 18px; font-weight: 800; }
  .chooser p { font-size: 13px; color: var(--sand); margin-top: 2px; }
  .langs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .lang-btn { position: relative; display: grid; gap: 2px; text-align: left; padding: 12px 12px 11px; border-radius: 14px; border: 1px solid var(--ebony-3); background: var(--ebony-2); transition: border-color .12s ease, transform .1s ease; }
  .lang-btn:hover { border-color: var(--gold); transform: translateY(-1px); }
  .lang-btn b { font-size: 16.5px; font-weight: 800; }
  .lang-btn small { font-size: 11.5px; color: var(--sand); line-height: 1.3; }
  .lang-btn { justify-items: start; align-content: start; }
  .lang-btn .soon { position: absolute; top: 8px; right: 8px; font-size: 10px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: var(--gold); }
  .chooser .later { display: block; margin: 10px auto 0; border: 0; background: none; color: var(--sand); font-size: 13px; padding: 6px 10px; border-radius: 8px; }
  .chooser .later:hover { color: #fff; background: var(--ebony-2); }

  /* ---------- phones: bottom sheet, larger touch targets ---------- */
  @media (max-width: 640px) {
    .panel { left: 0; right: 0; bottom: 0; width: 100%; max-height: 82vh; border-radius: 22px 22px 0 0; transform-origin: bottom center; }
    .panel .band { border-radius: 22px 22px 0 0; }
    .fab { right: 12px; bottom: 12px; padding: 8px 16px 8px 8px; }
    .fab.hidden-under-sheet { opacity: 0; pointer-events: none; }
    .panel.show ~ .fab { display: none; } /* the sheet has its own close button */
    .ph .lang, .lang-select { font-size: 16px; }
    .tip { max-width: calc(100vw - 16px); }
    .tr { font-size: 18px; }
    .icon-btn { width: 44px; height: 44px; }
    .say { width: 46px; height: 46px; }
    .toasts { top: 8px; width: calc(100vw - 16px); }
    .hint { right: 12px; bottom: 76px; }
    .chooser { left: 0; right: 0; bottom: 0; width: 100%; border-radius: 22px 22px 0 0; padding-bottom: 18px; }
    .lang-btn { padding: 14px 12px; }
  }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
  `;

  // Line icons (Lucide-style, ISC licence), static markup only.
  const ICONS = {
    volume: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>',
    mute: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2" class="f"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    check: '<circle cx="12" cy="12" r="10"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    auto: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="4"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m5 5 14 14"/>',
    dots: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    captions: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 15h4M14 15h3M7 11h3M13 11h4"/>',
    languages: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
    pointer: '<path d="M4 4l7 17 2.5-7.5L21 11 4 4z"/>',
    bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15 14c.2-1 .7-1.7 1.5-2.5A6 6 0 1 0 7.5 11.5c.8.8 1.3 1.5 1.5 2.5"/>',
    loader: '<path d="M21 12a9 9 0 1 1-6.2-8.6"/>',
    cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    monitor: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    bubble: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 13.5h4"/>',
    ok: '<path d="M20 6 9 17l-5-5"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  };
  function icon(name, extra = '') {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', `i ${extra}`.trim());
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = ICONS[name].replace(' class="f"', ' fill="currentColor" stroke="none"');
    return s;
  }

  /** Keep Chrome/Edge/Firefox page translators away from Langwa's own layer. */
  function makeHost() {
    host = document.createElement('langwa-root');
    host.setAttribute('translate', 'no');
    host.classList.add('notranslate');
  }

  function buildUI() {
    makeHost();
    shadow = host.attachShadow({ mode: 'open' });
    const layer = h('div', { class: 'layer notranslate', translate: 'no' });
    shadow.append(h('style', {}, CSS), layer);

    tipArrow = h('div', { class: 'arrow' });
    tipBody = h('div');
    tip = h('div', { class: 'tip', role: 'tooltip' }, tipArrow, tipBody);
    tip.addEventListener('mouseenter', () => clearTimeout(tipTimer));
    tip.addEventListener('mouseleave', hideTipSoon);

    hl = h('div', { class: 'hl' });
    subLayer = h('div', { class: 'subs' });
    toastBox = h('div', { class: 'toasts', 'aria-live': 'assertive' });

    panelStatus = h('div', { class: 'status' });
    panelList = h('div', { class: 'list' });
    pageBtn = h('button', { class: `icon-btn${state.subtitles ? ' on' : ''}`, title: `${ui('ui_page_mode', 'Traduire la page')} (Alt+Shift+T)`, 'aria-label': ui('ui_page_mode', 'Traduire la page') }, icon('languages'));
    pageBtn.addEventListener('click', () => setSubtitles(!state.subtitles, true));
    const readBtn = h('button', { class: 'icon-btn', title: `${ui('ui_read_all', 'Tout lire')} (Alt+Shift+L)`, 'aria-label': ui('ui_read_all', 'Tout lire') }, icon('volume'));
    readBtn.addEventListener('click', () => readAll(readBtn));
    const ccBtn = h('span', { style: 'display:flex;gap:8px' }, pageBtn, readBtn);
    // Two tabs: Assistant (ask about the page, by text or voice) and Messages (translated page).
    assistant = globalThis.LangwaAssistant.create({ h, icon, ui, state, send, player, voiceOpts, shownText, setLight, api, sayButton });
    const chatView = assistant.mount();
    tabCount = h('span', { class: 'tcount' });
    const tabBtn = (id, ic, label, extra) => h('button', { class: 'tab', role: 'tab', 'data-tab': id, onclick: () => setTab(id) }, icon(ic), h('span', {}, label), extra || null);
    tabsBar = h('div', { class: 'tabs', role: 'tablist' },
      tabBtn('chat', 'bubble', ui('ui_tab_chat', 'Assistant')),
      tabBtn('list', 'list', ui('ui_tab_msgs', 'Messages'), tabCount));
    views = { chat: chatView, list: panelList };
    panel = h('div', { class: 'panel', role: 'dialog', 'aria-label': `Langwa, ${state.pack.name}` },
      h('div', { class: 'band' }),
      h('div', { class: 'ph' },
        h('div', { class: 'logo' }, icon('languages')),
        h('div', { class: 'title' }, langPicker(), panelStatus),
        ccBtn,
        h('button', { class: 'icon-btn', title: ui('ui_close', 'Fermer'), 'aria-label': ui('ui_close', 'Fermer'), onclick: () => togglePanel(false) }, icon('x'))),
      tabsBar,
      chatView,
      panelList,
      h('div', { class: 'pf' }, ...(isTouch
        ? [icon('pointer'), ui('ui_hint_touch_short', 'appui long = traduction')]
        : [h('kbd', {}, 'Ctrl'), '+', icon('pointer'), ui('ui_hint_hover_short', 'survol = traduction')])));

    fabDot = h('span', { class: 'dot busy' });
    fabCount = h('span', { class: 'count' });
    fab = h('button', { class: 'fab', title: 'Alt+Shift+M', 'aria-label': `Langwa, ${state.pack.name}`, onclick: () => togglePanel() },
      h('span', { class: 'logo' }, icon('languages'), fabDot), state.pack.name, fabCount);

    layer.append(subLayer, hl, tip, panel, fab, toastBox);
    document.documentElement.append(host);
  }

  /** Language switcher in the panel header (the only way to switch on phones). */
  function langPicker() {
    const langs = Object.entries(state.langs || {});
    if (langs.length < 2) return h('div', { class: 'lang' }, state.pack.name);
    const sel = h('select', { class: 'lang lang-select', 'aria-label': ui('ui_language', 'Langue') },
      langs.map(([code, l]) => {
        const o = h('option', { value: code }, l.count || code === state.pack.code ? l.name : `${l.name} (${ui('ui_soon', 'Bientôt')})`);
        o.selected = code === state.pack.code;
        return o;
      }));
    sel.addEventListener('change', async () => {
      const cur = await send({ type: 'getSettings' });
      await api.storage.local.set({ settings: { ...cur, lang: sel.value } });
    });
    return sel;
  }

  /**
   * First use: "Which language do you speak?" with large buttons showing each language's own
   * name and region (people recognise the name of their language even if they cannot read
   * French). Languages without translations yet are marked "Soon". "Later" folds it into the
   * round button.
   */
  function buildChooser() {
    makeHost();
    shadow = host.attachShadow({ mode: 'open' });
    const layer = h('div', { class: 'layer notranslate', translate: 'no' });
    shadow.append(h('style', {}, CSS), layer);

    const choose = async code => {
      const cur = await send({ type: 'getSettings' });
      await api.storage.local.set({ settings: { ...cur, lang: code } }); // storage change restarts Langwa
    };
    const langs = Object.entries(state.langs || {}).sort((a, b) => (b[1].count > 0) - (a[1].count > 0));
    const card = h('div', { class: 'chooser', role: 'dialog', 'aria-label': ui('ui_choose', 'Quelle langue parlez-vous ?') },
      h('div', { class: 'head' },
        h('div', { class: 'logo' }, icon('languages')),
        h('div', {}, h('h3', {}, ui('ui_choose', 'Quelle langue parlez-vous ?')), h('p', {}, ui('ui_choose_sub', 'Langwa affichera la banque dans cette langue.')))),
      h('div', { class: 'langs' }, langs.map(([code, l]) =>
        h('button', { class: `lang-btn${l.count ? '' : ' empty'}`, onclick: () => choose(code) },
          h('b', {}, l.name),
          h('small', {}, l.region || ''),
          l.count ? null : h('span', { class: 'soon' }, ui('ui_soon', 'Bientôt'))))),
      h('button', { class: 'later', onclick: () => { card.hidden = true; fab.hidden = false; } }, ui('ui_later', 'Plus tard')));
    const fab = h('button', { class: 'fab', hidden: true, 'aria-label': ui('ui_choose', 'Quelle langue parlez-vous ?'), onclick: () => { card.hidden = false; fab.hidden = true; } },
      h('span', { class: 'logo' }, icon('languages')), 'Langwa');
    layer.append(card, fab);
    document.documentElement.append(host);
  }

  function destroyUI() {
    if (host) host.remove();
    host = null;
    tipUnits = null;
  }

  // ======================================================================================
  // Rendering helpers
  // ======================================================================================
  const STATUS = {
    ok: ['ok', 'check', 'ui_validated', 'Validé'],
    mt: ['mt', 'auto', 'ui_auto', 'Non validé'],
    gist: ['gist', 'info', 'ui_summary', 'Résumé sûr'],
    block: ['block', 'ban', 'ui_blocked', 'Bloqué : montant différent'],
    none: ['none', 'dots', 'ui_missing', 'Pas encore traduit'],
  };
  function statusKey(r) {
    if (r.status === 'ok') return r.verified ? 'ok' : 'mt';
    if (r.status === 'gist') return 'gist';
    if (r.status === 'blocked') return 'block';
    return 'none';
  }
  function pillFor(r) {
    const [cls, ic, id, fr] = STATUS[statusKey(r)];
    return h('span', { class: `pill ${cls}` }, icon(ic), ui(id, fr));
  }

  function chipsFor(text) {
    const ents = P.extract(P.normSpaces(text), { literals: [...state.literals] });
    return ents.map(e => h('span', { class: 'chip', title: ui('ui_protected', 'Valeur protégée') }, icon('lock'), e.value));
  }

  // ---------------- listening (human recordings + exact values) ----------------
  const player = globalThis.LangwaSpeech.createPlayer({
    online: () => !!(state.settings && state.settings.onlineVoice),
    language: () => (state.pack ? { voices: state.pack.voices, reading: state.pack.reading } : {}),
    tts: text => send({ type: 'tts', lang: state.pack.code, text }).catch(() => null),
  });
  const ttsOn = () => {
    const mode = state.settings && state.settings.tts && state.settings.tts.mode;
    return !!(state.pack && ((mode === 'mms' && state.pack.mms) || (mode === 'africa' && state.pack.africaTts)));
  };

  const bars = () => h('span', { class: 'bars', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'));
  const voiceName = v => (v === 'human' ? ui('ui_voice_human', 'Voix humaine') : v === 'neural' ? ui('ui_voice_local', 'Voix locale') : ui('ui_voice_browser', 'Voix du navigateur'));
  /** Name of the local model in use, shown next to "Voix locale". */
  const modelName = () => { const m = state.settings && state.settings.tts && state.settings.tts.mode; return m === 'africa' ? 'Africa TTS' : m === 'mms' ? 'MMS' : ''; };
  const WHY = {
    offline: ['ui_voice_why_offline', 'voix locale éteinte'],
    loading: ['ui_voice_why_loading', 'voix locale en chargement'],
    slow: ['ui_voice_why_slow', 'voix locale trop lente'],
    error: ['ui_voice_why_error', 'voix locale indisponible'],
  };
  const SRC = {
    local: ['cpu', () => [voiceName('neural'), modelName()].filter(Boolean).join(' · ')],
    wait: ['loader', () => ui('ui_voice_preparing', 'Voix locale, préparation…')],
    browser: ['monitor', () => voiceName('synthetic')],
    human: ['user', () => voiceName('human')],
  };
  /**
   * The voice chip under a translation. Before playing it says which voice is planned; while
   * playing it shows, live, who really speaks, and why the browser voice took over if it did.
   */
  function voiceChip(steps) {
    if (!steps) return null;
    const chip = h('div', { class: 'vchip', role: 'status', 'aria-live': 'polite' });
    setChip(chip, steps.voice === 'neural' ? 'local' : steps.voice === 'human' ? 'human' : 'browser');
    return chip;
  }
  function setChip(chip, src, why, live = false) {
    const [ic, text] = SRC[src] || SRC.browser;
    chip.dataset.src = src;
    chip.classList.toggle('live', live && src !== 'wait');
    const w = why && WHY[why];
    chip.replaceChildren(h('span', { class: 'dot' }), icon(ic), h('span', { class: 'vt' }, text(), w ? h('span', { class: 'why' }, ` · ${ui(w[0], w[1])}`) : null));
    chip.title = chip.textContent;
  }
  const chipFor = b => { const host = b && (b.closest('.block') || b.closest('.item') || b.closest('.tip')); return host && host.querySelector('.vchip'); };

  /** One tap to listen, tap again to stop. Shows which voice will speak (human or synthetic). */
  function sayButton(steps, label, { compact = false } = {}) {
    if (!steps) return null;
    const idle = () => [icon('volume'), compact ? null : h('span', { class: 'lbl' }, label)];
    const b = h('button', { class: `say${compact ? '' : ' wide'}`, title: `${label} · ${voiceName(steps.voice)}`, 'aria-label': label }, ...idle());
    b.addEventListener('click', ev => {
      ev.stopPropagation();
      if (b.classList.contains('on')) { player.stop(); return; }
      if (askOnlineVoice(b, () => speak(steps, b, idle))) return;
      speak(steps, b, idle);
    });
    return b;
  }
  /**
   * No good voice installed on the device (only online ones): ask once, in the card, whether to
   * use the natural online voices. One tap turns them on and plays; nothing is sent without it.
   */
  let askedOnline = false;
  function askOnlineVoice(b, then) {
    if (askedOnline || (state.settings && state.settings.onlineVoice)) return false;
    const L = globalThis.LangwaSpeech;
    const prefs = [...((state.pack && state.pack.voices) || []).map(x => x.toLowerCase()), 'sw', 'fr'];
    const local = L.pickVoice(prefs, false);
    if (local && /natural|neural|premium|enhanced/i.test(local.name)) return false; // already a natural voice on the device
    if (!L.pickVoice(prefs, true)) return false;                                       // no online voice either
    askedOnline = true;
    const card = b.closest('.block') || b.parentElement;
    const bar = h('div', { class: 'consent' },
      h('div', {}, h('b', {}, ui('ui_online_ask', 'Voix plus naturelle ?')), ' ', ui('ui_online_voice_sub', 'Plus fluide. Le texte lu est envoyé à Microsoft ou Google.')),
      h('div', { class: 'cbtns' },
        h('button', { class: 'cyes', onclick: e => { e.stopPropagation(); bar.remove(); setLight({ onlineVoice: true }); then(); } }, ui('ui_enable', 'Activer')),
        h('button', { class: 'cno', onclick: e => { e.stopPropagation(); bar.remove(); then(); } }, ui('ui_no_thanks', 'Non merci'))));
    card.append(bar);
    return true;
  }

  /** Settings that do not need Langwa to restart (voice, reading): saved without rebuilding the UI. */
  const LIGHT_SETTINGS = ['onlineVoice', 'autoRead', 'pageMode'];
  function setLight(patch) {
    state.settings = { ...state.settings, ...patch };
    send({ type: 'getSettings' }).then(cur => api.storage.local.set({ settings: { ...cur, ...patch } })).catch(() => {});
  }

  /** Plays steps, animating the button that started it (if any). */
  function speak(steps, b, idle) {
    if (!steps) return;
    if (b) { b.classList.add('on'); b.replaceChildren(bars(), compact(b) ? null : h('span', { class: 'lbl' }, ui('ui_stop', 'Arrêter'))); }
    const chip = chipFor(b);
    player.play(steps,
      () => { if (b) { b.classList.remove('on'); b.replaceChildren(...idle()); } if (chip) chip.classList.remove('live'); },
      (src, why) => { if (chip) setChip(chip, src, why, true); if (b) b.title = `${listenLabel()} · ${(SRC[src] || SRC.browser)[1]()}`; });
  }
  const compact = b => !b.classList.contains('wide');
  const listenLabel = () => ui('ui_listen', 'Écouter');
  const voiceOpts = () => ({ tts: ttsOn(), approx: !state.settings || state.settings.voiceFallback !== false });
  const stepsFor = r => (r && (r.status === 'ok' || r.status === 'gist') ? player.prepare(r.speech, voiceOpts()) : null);

  function shownText(u) {
    const r = u.result;
    return r && (r.status === 'ok' || r.status === 'gist') ? r.text : u.text;
  }

  /** One card block, used by the hover card, the panel and the alerts. */
  /** "Mots du dictionnaire": open-source words for a sentence that has no translation yet. */
  function wordsRow(r) {
    if (!r || !r.words || !r.words.length) return null;
    return h('div', { class: 'words' },
      h('div', { class: 'wl' }, icon('book'), ui('ui_dict_words', 'Mots du dictionnaire (non validés)')),
      h('div', { class: 'wchips' }, r.words.map(w => h('span', { class: 'wchip' }, h('b', {}, w.term), h('i', {}, w.src)))));
  }

  function block(u, { isNew = false, inPanel = false } = {}) {
    const r = u.result;
    if (!r) {
      return h('div', { class: 'block k-pending' },
        h('div', { class: 'skeleton', 'aria-label': ui('ui_translating', 'Traduction en cours…') }),
        h('div', { class: 'orig' }, u.text));
    }
    if (r.value) {
      return h('div', { class: 'block k-value' },
        h('div', { class: 'row' },
          h('div', { class: 'tr' }, icon('lock'), u.text),
          sayButton([{ value: u.text, type: r.brand ? 'name' : undefined }], listenLabel())),
        h('div', { class: 'meta' }, h('span', { class: 'pill none' }, r.brand
          ? ui('ui_brand', 'Nom propre, non traduit')
          : ui('ui_protected', 'Valeur protégée, identique à la page'))));
    }
    const shown = r.status === 'ok' || r.status === 'gist';
    const kindIcon = r.kind === 'error' ? icon('alert', 'kind err') : r.kind === 'warning' ? icon('alert', 'kind warn') : r.kind === 'success' ? icon('check', 'kind okk') : null;
    const newTag = isNew ? h('span', { class: 'new' }, ui('ui_new', 'NOUVEAU')) : null;
    if (!shown && inPanel) {
      // Panel list: the original sentence stays readable, with a quiet "not translated" tag.
      return h('div', { class: `block k-${r.kind || 'info'}` },
        h('div', { class: 'row' }, h('div', { class: 'tr plain' }, newTag, kindIcon, u.text)),
        wordsRow(r),
        h('div', { class: 'meta' }, chipsFor(u.text), r.status === 'blocked' ? pillFor(r) : h('span', { class: 'pill none' }, icon('dots'), ui('ui_missing', 'Pas encore traduit'))));
    }
    const missing = ui('ui_missing_lang', 'Pas encore traduit en {lang}').replace('{lang}', state.pack.name);
    return h('div', { class: `block k-${r.kind || 'info'}` },
      h('div', { class: 'row' },
        shown
          ? h('div', { class: 'tr' }, isNew ? h('span', { class: 'new' }, ui('ui_new', 'NOUVEAU')) : null, kindIcon, shownText(u))
          : h('div', { class: 'tr missing' }, isNew ? h('span', { class: 'new' }, ui('ui_new', 'NOUVEAU')) : null, kindIcon, missing),
        (r.status === 'ok' || r.status === 'gist') ? sayButton(stepsFor(r), listenLabel()) : null),
      r.explain ? h('div', { class: 'explain' }, icon('bulb'), h('span', {}, r.explain)) : null,
      shown ? voiceChip(stepsFor(r)) : null,
      h('div', { class: 'orig' }, h('b', {}, ui('ui_original', 'Original')), u.text),
      shown ? null : wordsRow(r),
      h('div', { class: 'meta' }, chipsFor(u.text), shown || r.status === 'blocked' ? pillFor(r) : null));
  }

  // ======================================================================================
  // Hover card
  // ======================================================================================
  let tipTimer = null;
  let tipUnits = null;
  let tipAnchor = null;

  function showTip(units, anchor) {
    // Prefer translatable text; show the "protected value" card only when that is all there is.
    const text = units.filter(u => !u.result || !u.result.value);
    const list = text.length ? text : units.slice(0, 1);
    if (!list.length) return;
    clearTimeout(tipTimer);
    tipUnits = units;
    tipAnchor = anchor;
    tipBody.replaceChildren(...list.map(u => block(u)));
    tip.classList.add('show');
    place(anchor);
    autoReadSoon(list);
  }

  // Automatic reading: the card is read aloud as soon as it opens (settle 350 ms first).
  let autoTimer = null;
  let autoKey = '';
  function autoReadSoon(list) {
    clearTimeout(autoTimer);
    if (!state.settings || !state.settings.autoRead) return;
    const u = list.find(x => x.result && !x.result.value && stepsFor(x.result));
    if (!u) return;
    const key = u.text;
    if (key === autoKey && player.isPlaying()) return;
    autoTimer = setTimeout(() => {
      if (!tip.classList.contains('show') || !tipUnits || !tipUnits.includes(u)) return;
      autoKey = key;
      const b = tip.querySelector('.say');
      speak(stepsFor(u.result), b, () => [icon('volume'), h('span', { class: 'lbl' }, listenLabel())]);
    }, 350);
  }

  /** Reads the whole page aloud: important messages first, then the page in order. */
  let readingAll = false;
  async function readAll(btn) {
    if (readingAll) { readingAll = false; player.stop(); return; }
    const shown = state.units.filter(u => u.result && !u.result.value && stepsFor(u.result));
    const alerts = shown.filter(u => u.result.kind === 'error' || u.result.kind === 'warning');
    const queue = [...alerts, ...shown.filter(u => !alerts.includes(u))];
    if (!queue.length) return;
    readingAll = true;
    if (btn) btn.classList.add('on');
    for (const u of queue) {
      if (!readingAll) break;
      highlight(u.el, true);
      if (u.el.scrollIntoView) u.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      await new Promise(res => player.play(stepsFor(u.result), res));
      await new Promise(res => setTimeout(res, 250));
    }
    readingAll = false;
    highlight(null);
    if (btn) btn.classList.remove('on');
  }

  function place(anchor) {
    const a = anchor.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    let top = a.bottom + 12;
    const above = top + t.height > innerHeight - 8 && a.top - t.height - 12 > 8;
    if (above) top = a.top - t.height - 12;
    top = Math.max(8, Math.min(top, innerHeight - t.height - 8));
    const left = Math.min(Math.max(8, a.left), innerWidth - t.width - 8);
    tip.classList.toggle('above', above);
    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
    const ax = Math.min(Math.max(a.left + Math.min(a.width, 160) / 2 - left - 7, 14), t.width - 28);
    tipArrow.style.left = `${ax}px`;
  }

  function hideTipSoon() {
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => { if (tip) tip.classList.remove('show'); tipUnits = null; }, 220);
  }

  function unitsAt(target) {
    for (let el = target; el && el !== document.documentElement; el = el.parentElement) {
      const us = state.unitsByEl.get(el);
      if (us && us.length) return { el, us };
    }
    return null;
  }

  // Hover modes: 'ctrl' (hold Ctrl/Cmd and point at any text, paragraph or button),
  // 'always' (any hover), 'off'. The card opens just below the element.
  let lastTarget = null;
  let lastShownFor = null;
  const hoverMode = () => (state.settings && state.settings.hover) || 'ctrl';
  const modKey = e => e.ctrlKey || e.metaKey;
  const fromLayer = e => host && e.composedPath().includes(host);

  function showFor(target) {
    const hit = unitsAt(target);
    if (!hit) { hideTipSoon(); highlight(null); return; }
    showTip(hit.us, hit.el);
    highlight(hit.el);
  }

  // While Ctrl is held the card lets the mouse through (keep exploring); release Ctrl to click 🔊.
  const setPassThrough = on => tip && tip.classList.toggle('passthru', on);

  function onOver(e) {
    if (fromLayer(e)) return;
    lastTarget = e.target;
    const mode = hoverMode();
    if (mode === 'off') return;
    if (mode === 'ctrl' && !modKey(e)) { hideTipSoon(); highlight(null); return; }
    showFor(e.target);
  }

  function onMove(e) {
    if (hoverMode() !== 'ctrl') return;
    setPassThrough(modKey(e));
    if (!modKey(e) || fromLayer(e)) return;
    lastTarget = e.target;
    if (e.target === lastShownFor && tip.classList.contains('show')) return;
    lastShownFor = e.target;
    showFor(e.target);
  }

  function onModKey(e) {
    // Ctrl + Space while a card is showing: listen to it (again = stop). Only then, so
    // Ctrl + Space keeps its usual meaning everywhere else.
    if (e.type === 'keydown' && e.code === 'Space' && (e.ctrlKey || e.metaKey) && tip && tip.classList.contains('show') && tipUnits) {
      e.preventDefault();
      e.stopPropagation();
      if (player.isPlaying()) { player.stop(); return; }
      const u = tipUnits.find(x => x.result && stepsFor(x.result));
      if (u) speak(stepsFor(u.result), tip.querySelector('.say'), () => [icon('volume'), h('span', { class: 'lbl' }, listenLabel())]);
      return;
    }
    if (hoverMode() !== 'ctrl' || (e.key !== 'Control' && e.key !== 'Meta')) return;
    setPassThrough(e.type === 'keydown');
    if (e.type === 'keydown' && lastTarget && !e.repeat) showFor(lastTarget);
    if (e.type === 'keyup') highlight(null);
  }

  // Touch: a long press (450 ms, finger still) shows the card under the element. The click
  // that follows a long press is cancelled, so a bank button is never activated by it.
  // Normal taps are untouched.
  let pressTimer = null;
  let pressXY = null;
  let swallowClick = false;
  function onTouchStart(e) {
    if (fromLayer(e)) return;
    if (tip && tip.classList.contains('show')) hideTipSoon();
    if (hoverMode() === 'off' || e.touches.length !== 1) return;
    const t = e.touches[0];
    const target = e.target;
    pressXY = [t.clientX, t.clientY];
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      pressTimer = null;
      if (!unitsAt(target)) return;
      swallowClick = true;
      showFor(target);
      if (navigator.vibrate) navigator.vibrate(12);
    }, 450);
  }
  function onTouchMove(e) {
    if (!pressTimer || !pressXY) return;
    const t = e.touches[0];
    if (Math.hypot(t.clientX - pressXY[0], t.clientY - pressXY[1]) > 10) { clearTimeout(pressTimer); pressTimer = null; }
  }
  function onTouchEnd(e) {
    clearTimeout(pressTimer);
    pressTimer = null;
    if (swallowClick && !fromLayer(e)) { e.preventDefault(); setTimeout(() => { swallowClick = false; }, 450); }
  }
  function onClickCapture(e) {
    if (swallowClick && !fromLayer(e)) { e.preventDefault(); e.stopPropagation(); swallowClick = false; }
  }
  function onContextMenu(e) {
    if ((swallowClick || pressTimer) && !fromLayer(e)) e.preventDefault();
  }

  function onFocus(e) {
    if (hoverMode() === 'off' || fromLayer(e)) return;
    const el = e.target;
    const us = [...(state.unitsByEl.get(el) || [])];
    if (el.labels) for (const l of el.labels) us.push(...(state.unitsByEl.get(l) || []));
    if (us.length) showTip(us, el);
  }

  // ======================================================================================
  // Panel, status, highlight, subtitles, alerts, first-run hint
  // ======================================================================================
  function togglePanel(force) {
    state.panelOpen = force ?? !state.panelOpen;
    panel.classList.toggle('show', state.panelOpen);
    fab.classList.toggle('hidden-under-sheet', state.panelOpen && innerWidth <= 640);
    if (state.panelOpen) { setTab(state.tab || 'chat'); hideHint(); }
  }

  let panelTimer = null;
  function renderPanelSoon() {
    if (panelTimer) return;
    panelTimer = setTimeout(() => {
      panelTimer = null;
      updateStatus();
      if (state.panelOpen) renderPanel();
      if (state.subtitles) placeSubtitles();
    }, 120);
  }

  function itemFor(u) {
    const item = h('button', {
      class: `item k-${(u.result && u.result.kind) || 'info'}`,
      onmouseenter: () => highlight(u.el),
      onmouseleave: () => highlight(null),
      onclick: () => {
        u.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(() => highlight(u.el, true), 350);
      },
    }, block(u, { isNew: u.isNew, inPanel: true }));
    return item;
  }

  function renderPanel() {
    const shown = state.units.filter(u => !u.result || !u.result.value);
    const alerts = shown.filter(u => u.result && (u.result.kind === 'error' || u.result.kind === 'warning'));
    const rest = shown.filter(u => !alerts.includes(u));
    const scroll = panelList.scrollTop;
    panelList.replaceChildren(
      ...(alerts.length ? [h('div', { class: 'sec alert' }, icon('alert'), ui('ui_important', 'Messages importants'), h('span', { class: 'n' }, String(alerts.length))), ...alerts.map(itemFor)] : []),
      ...(rest.length ? [h('div', { class: 'sec' }, ui('ui_page', 'Sur cette page'), h('span', { class: 'n' }, String(rest.length))), ...rest.map(itemFor)] : []),
      ...(!shown.length ? [h('div', { class: 'empty' }, icon('languages'), ui('ui_empty', 'Rien à traduire ici'))] : []));
    panelList.scrollTop = scroll;
  }

  const COUNT_WORDS = {
    ok: ['ui_n_ok', 'validées'], mt: ['ui_n_mt', 'non validées'], gist: ['ui_n_gist', 'résumés'],
    block: ['ui_n_block', 'bloquées'], none: ['ui_n_none', 'non traduites'],
  };

  function updateStatus() {
    if (!host) return;
    const c = { ok: 0, mt: 0, gist: 0, block: 0, none: 0 };
    let pending = 0;
    let alerts = 0;
    for (const u of state.units) {
      const r = u.result;
      if (!r) { pending++; continue; }
      if (r.value) continue;
      c[statusKey(r)]++;
      if (r.kind === 'error' || r.kind === 'warning') alerts++;
    }
    state.pending = pending;
    fabDot.className = `dot${pending ? ' busy' : state.mtError ? ' warn' : ''}`;
    fabCount.textContent = alerts;
    if (tabCount) { tabCount.textContent = alerts ? String(alerts) : ''; tabCount.classList.toggle('show', alerts > 0); }
    fabCount.classList.toggle('show', alerts > 0);
    const bits = [];
    if (pending) bits.push(h('span', {}, icon('loader', 'spin'), ui('ui_translating', 'Traduction en cours…')));
    for (const k of ['ok', 'mt', 'gist', 'block', 'none']) {
      if (!c[k]) continue;
      const [cls, ic, id, fr] = STATUS[k];
      const [wid, word] = COUNT_WORDS[k];
      const label = c[k] === 1 ? ui(`${wid}_one`, ui(wid, word)) : ui(wid, word);
      bits.push(h('span', { class: cls, title: ui(id, fr) }, icon(ic), `${c[k]} ${label}`));
    }
    if (state.mtError) bits.push(h('span', { class: 'warn' }, icon('alert'), ui('ui_mt_down', 'Traduction locale indisponible : résumé utilisé')));
    panelStatus.replaceChildren(...bits);
    panelStatus.title = `${state.stats.count} éléments · analyse ${state.stats.ms} ms`;
  }

  function highlight(el, pulse = false) {
    if (!hl) return;
    if (!el) { hl.style.display = 'none'; hl.classList.remove('pulse'); return; }
    const r = el.getBoundingClientRect();
    Object.assign(hl.style, { display: 'block', top: `${r.top - 5}px`, left: `${r.left - 5}px`, width: `${r.width + 10}px`, height: `${r.height + 10}px` });
    hl.classList.toggle('pulse', pulse);
  }

  /**
   * Translate the whole page: each translated text is covered by its translation, drawn in the
   * page's own font, colour and background. Nothing in the page is modified, clicks go through
   * to the bank's buttons, and hovering still shows the card with the original.
   */
  function setSubtitles(on, remember = false) {
    state.subtitles = on;
    if (pageBtn) pageBtn.classList.toggle('on', on);
    if (on) placeSubtitles(); else if (subLayer) subLayer.replaceChildren();
    if (remember) setLight({ pageMode: on });
  }

  const lookCache = new WeakMap();
  function pageLook(el) {
    let l = lookCache.get(el);
    if (l) return l;
    const cs = getComputedStyle(el);
    let bg = null;
    for (let a = el; a; a = a.parentElement) {
      const c = getComputedStyle(a);
      if (c.backgroundImage && c.backgroundImage !== 'none') break; // gradient or image: decide below
      const m = c.backgroundColor.match(/rgba?\(([^)]+)\)/);
      if (m && (m[1].split(',')[3] === undefined || parseFloat(m[1].split(',')[3]) > 0.98)) { bg = c.backgroundColor; break; }
    }
    if (!bg) {
      const rgb = (cs.color.match(/\d+/g) || [0, 0, 0]).map(Number);
      const light = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 > 150;
      bg = light ? 'rgb(24,18,40)' : 'rgb(255,255,255)'; // fully opaque: no trace of the original
    }
    l = { font: cs.fontFamily, size: parseFloat(cs.fontSize) || 15, weight: cs.fontWeight, color: cs.color, align: cs.textAlign, bg, lh: cs.lineHeight };
    lookCache.set(el, l);
    return l;
  }

  let subRaf = 0;
  function placeSubtitles() {
    if (!state.subtitles || !subLayer) return;
    cancelAnimationFrame(subRaf);
    subRaf = requestAnimationFrame(() => {
      const nodes = [];
      for (const u of state.units) {
        const r = u.result;
        if (!r || r.value || u.attr || (r.status !== 'ok' && r.status !== 'gist')) continue;
        if (u.el === document.body || u.el === document.documentElement) continue;
        const b = u.el.getBoundingClientRect();
        if (b.bottom < 0 || b.top > innerHeight || b.width === 0) continue;
        const l = pageLook(u.el);
        // A container holding several lines of mixed content is not covered (that would hide the page).
        if (b.height > Math.max(140, l.size * 7)) continue;
        // Free space on the line: up to the next item on the right (e.g. an amount), never over it.
        let right = (u.el.parentElement || u.el).getBoundingClientRect().right;
        for (let sib = u.el.nextElementSibling; sib; sib = sib.nextElementSibling) {
          const sr = sib.getBoundingClientRect();
          if (sr.width && sr.left >= b.right - 1 && sr.top < b.bottom && sr.bottom > b.top) { right = Math.min(right, sr.left - 8); break; }
        }
        const avail = Math.max(b.width, Math.min(right, innerWidth - 4) - b.left);
        // Longer translations get a slightly smaller font so they stay in their place.
        const ratio = Math.min(1, Math.max(0.78, Math.sqrt(u.text.length / Math.max(1, r.text.length))));
        const isButton = /^(BUTTON|A)$/.test(u.el.tagName) || u.el.getAttribute('role') === 'button';
        const s = h('div', { class: 'sub' }, r.text);
        Object.assign(s.style, {
          top: `${b.top}px`, left: `${b.left}px`, minWidth: `${b.width}px`, maxWidth: `${avail}px`, width: 'max-content', minHeight: `${b.height}px`,
          display: 'flex', alignItems: 'center',
          justifyContent: isButton || l.align === 'center' ? 'center' : l.align === 'right' || l.align === 'end' ? 'flex-end' : 'flex-start',
          textAlign: isButton ? 'center' : l.align,
          fontFamily: l.font, fontSize: `${(l.size * ratio).toFixed(1)}px`, fontWeight: l.weight, color: l.color,
          background: l.bg, lineHeight: '1.25', borderRadius: isButton ? getComputedStyle(u.el).borderRadius : '4px',
        });
        nodes.push(s);
      }
      subLayer.replaceChildren(...nodes);
    });
  }

  function toast(u) {
    if (!state.settings.toasts || !toastBox) return;
    const close = () => t.remove();
    const t = h('div', { class: `toast k-${u.result.kind || 'info'}`, role: 'alert' },
      block(u, { isNew: true }),
      h('button', { class: 'x', 'aria-label': ui('ui_close', 'Fermer'), onclick: close }, icon('x')),
      h('div', { class: 'bar' }));
    t.querySelector('.bar').addEventListener('animationend', close);
    toastBox.append(t);
    while (toastBox.children.length > 3) toastBox.firstChild.remove();
    if (state.settings.autoSpeak !== false) {
      const steps = stepsFor(u.result);
      if (steps) player.play(steps);
    }
  }

  let hintEl = null;
  async function showFirstRunHint() {
    try {
      const { hintShown } = await api.storage.local.get('hintShown');
      if (hintShown || !host || hoverMode() !== 'ctrl' || state.panelOpen) return;
    } catch { return; }
    const done = () => { hideHint(); api.storage.local.set({ hintShown: true }).catch(() => {}); };
    hintEl = h('div', { class: 'hint', role: 'dialog' },
      h('div', { class: 'demo' }, ...(isTouch ? [] : [h('kbd', {}, 'Ctrl'), '+']), icon('pointer'), '→', h('span', { class: 'bubble' }, icon('bubble'))),
      h('div', { class: 'line' }, isTouch
        ? ui('ui_hint_touch', 'Appuyez longuement sur un texte : sa traduction s\'affiche dessous.')
        : ui('ui_hint_hover', 'Maintenez Ctrl et pointez un texte : sa traduction s\'affiche dessous.')),
      h('div', { class: 'line' }, h('span', { class: 'say' }, icon('volume')), isTouch ? ui('ui_hint_listen_touch', 'Touchez Écouter pour entendre la traduction.') : h('span', {}, h('kbd', {}, 'Ctrl+Espace'), ' ', ui('ui_space_listen', 'écouter'))),
      h('button', { class: 'ok', onclick: done }, icon('ok'), ui('ui_ok', 'Compris')));
    host.shadowRoot.querySelector('.layer').append(hintEl);
  }
  function hideHint() { if (hintEl) { hintEl.remove(); hintEl = null; } }

  // ======================================================================================
  // Collecting interface text
  // ======================================================================================
  function visible(el) {
    if (el.tagName === 'OPTION') return el.parentElement ? visible(el.closest('select') || el.parentElement) : false;
    return el.checkVisibility ? el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) : el.getClientRects().length > 0;
  }

  function collectLiterals() {
    for (const el of document.querySelectorAll('input:not([type=password]):not([type=hidden]):not([type=checkbox]):not([type=radio])')) {
      if (el === document.activeElement) continue; // ignore half-typed values
      const v = (el.value || '').trim();
      if (v.length >= 2 && v.length <= 80) state.literals.add(v);
    }
    if (state.literals.size > 60) state.literals = new Set([...state.literals].slice(-60));
  }

  function collect() {
    const blockCache = new Map();
    const isUnit = el => {
      let r = blockCache.get(el);
      if (r === undefined) {
        const d = getComputedStyle(el).display;
        r = d !== 'inline' && d !== 'contents';
        blockCache.set(el, r);
      }
      return r;
    };
    const groups = new Map();
    // Ignored elements are rejected once with their whole subtree (no per-text-node lookup).
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (n.nodeType === 1) return n.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
        return /\S/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      let el = n.parentElement;
      while (el !== document.body && !isUnit(el)) el = el.parentElement;
      let g = groups.get(el);
      if (!g) groups.set(el, (g = []));
      g.push(n);
    }
    const out = [];
    for (const [el, nodes] of groups) {
      if (!visible(el)) continue;
      const text = nodes.map(n => n.nodeValue).join('').replace(/\s+/g, ' ').trim();
      if (text) out.push({ el, attr: null, text });
    }
    const sel = ATTRS.map(a => `[${a}]`).join(',') + ',input[type=submit][value],input[type=button][value]';
    for (const el of document.body.querySelectorAll(sel)) {
      if (el.closest(SKIP) || !visible(el)) continue;
      for (const a of [...ATTRS, 'value']) {
        if (a === 'value' && !(el.tagName === 'INPUT' && /^(submit|button)$/i.test(el.type))) continue;
        const v = (el.getAttribute(a) || '').trim();
        if (v && /\p{L}{2,}/u.test(v)) out.push({ el, attr: a, text: v.replace(/\s+/g, ' ') });
      }
    }
    return out;
  }

  // ======================================================================================
  // Translation pipeline
  // ======================================================================================
  const mtQueue = [];
  let mtTimer = null;
  function requestMT(part) {
    if (!state.settings.mt || state.settings.mt.mode === 'none') return Promise.resolve(null);
    return new Promise(resolve => {
      mtQueue.push({ part, resolve });
      clearTimeout(mtTimer);
      mtTimer = setTimeout(flushMT, 150);
    });
  }
  async function flushMT() {
    const batch = mtQueue.splice(0, 30);
    if (mtQueue.length) mtTimer = setTimeout(flushMT, 50);
    const uniq = [...new Set(batch.map(b => b.part.masked))];
    let res = [];
    try {
      // Only the MASKED text is sent: no amount, name or number leaves the page.
      const reply = await send({ type: 'translateBatch', lang: state.pack.code, items: uniq.map(m => ({ masked: m })) });
      res = (reply && reply.results) || [];
      const err = !!(reply && reply.error);
      if (err !== state.mtError) { state.mtError = err; renderPanelSoon(); }
    } catch { res = []; }
    for (const b of batch) b.resolve(res[uniq.indexOf(b.part.masked)] || null);
  }

  /**
   * Context: the platform's own name, read from the page (title, declared site name, logo
   * description). It is protected like a brand: "Safinum Pay" is never translated.
   */
  function pageBrands() {
    const names = new Set();
    const add = s => { const v = (s || '').trim(); if (v && v.length <= 40 && v.split(/\s+/).length <= 4 && /^\p{Lu}/u.test(v)) names.add(v); };
    for (const part of (document.title || '').split(/\s+[|·•:–—-]\s+/)) add(part);
    for (const sel of ['meta[property="og:site_name"]', 'meta[name="application-name"]', 'meta[name="apple-mobile-web-app-title"]']) {
      const m = document.querySelector(sel); if (m) add(m.content);
    }
    for (const img of document.querySelectorAll('header img[alt], nav img[alt], [class*="logo" i] img[alt], img[class*="logo" i][alt]')) add(img.alt);
    return [...names].filter(n => !/^(accueil|home|connexion|login|test)$/i.test(n));
  }

  async function translateText(text) {
    const literals = [...state.literals].filter(l => text.includes(l));
    const plan = state.engine.plan(text, literals, state.brands || []);
    if (plan.skip) return { value: true, brand: !!plan.brand, status: 'value', text: plan.text, original: plan.text };
    const outs = await Promise.all(plan.parts.map(async part => {
      if (part.kind === 'lit') return { text: part.text, verified: true, source: 'literal' };
      const g = state.engine.lookupMasked(part.masked, part.tokens);
      if (g) return g;
      const mt = await requestMT(part);
      if (!mt) return null;
      const un = P.unmask(mt.text, part.tokens);
      if (!un.ok) return { blocked: true, problems: un.problems };
      return { text: un.text, verified: false, source: 'local-mt', confidence: mt.confidence };
    }));
    return state.engine.finalize(text, plan, outs, literals);
  }

  function resultFor(text) {
    const lits = [...state.literals].filter(l => text.includes(l)).join('\u0002');
    const key = `${text}\u0001${lits}`;
    let r = state.results.get(key);
    if (!r) {
      r = translateText(text).catch(err => {
        console.warn('[Langwa] translation failed:', err);
        return { status: 'untranslated', text, original: text, kind: E.classify(text) };
      });
      if (state.results.size >= 1500) state.results.delete(state.results.keys().next().value);
    } else {
      state.results.delete(key); // refresh LRU position
    }
    state.results.set(key, r);
    return r;
  }

  function scan() {
    if (!state.active) return;
    const t0 = performance.now();
    const gen = state.gen;
    try {
      collectLiterals();
      const now = Date.now();
      const found = collect();
      const units = [];
      const byEl = new Map();
      for (const f of found) {
        const known = state.known.get(f.el) || [];
        let u = known.find(k => k.attr === f.attr && k.text === f.text);
        if (!u) {
          // "New" = a text never seen on this site in this session (a box the page simply re-draws
          // when changing step is not new).
          const fresh = !seenTexts.has(f.text);
          seenTexts.add(f.text);
          u = { ...f, firstSeen: now, isNew: fresh && now - state.startedAt > NEW_AFTER_MS, result: null };
          state.known.set(f.el, [...known.filter(k => k.attr !== f.attr), u]);
          resultFor(u.text).then(r => {
            if (gen !== state.gen) return; // a restart happened meanwhile
            u.result = r;
            onResult(u);
          });
        }
        units.push(u);
        let list = byEl.get(u.el);
        if (!list) byEl.set(u.el, (list = []));
        list.push(u);
      }
      state.units = units;
      state.unitsByEl = byEl;
      state.stats = { ms: Math.round(performance.now() - t0), count: units.length };
    } catch (err) {
      console.warn('[Langwa] scan failed:', err);
    }
    renderPanelSoon();
  }

  function onResult(u) {
    const r = u.result;
    renderPanelSoon();
    if (tipUnits && tipUnits.includes(u) && tip.classList.contains('show')) showTip(tipUnits, tipAnchor);
    // Alert only when Langwa has something useful to show (translation, safe summary or dictionary words).
    const helpful = r && (r.status === 'ok' || r.status === 'gist' || (r.words && r.words.length));
    if (u.isNew && r && !r.value && helpful && ALERT_KINDS.has(r.kind)) toast(u);
  }

  // ======================================================================================
  // Lifecycle
  // ======================================================================================
  let observer = null;
  let scanTimer = null;
  let lastScan = 0;
  let missedWhileHidden = false;

  /** Coalesce bursts of DOM changes into one scan, run when the browser is idle, never in a hidden tab. */
  function scanSoon() {
    if (scanTimer) return;
    const wait = Math.max(120, 300 - (Date.now() - lastScan));
    scanTimer = setTimeout(() => {
      const run = () => {
        scanTimer = null;
        if (document.hidden) { missedWhileHidden = true; return; }
        lastScan = Date.now();
        scan();
      };
      if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 400 }); else run();
    }, wait);
  }

  function siteEnabled(settings) {
    const here = location.protocol === 'file:' ? 'file://' : location.origin;
    return (settings.sites || []).some(s => here === s || here.startsWith(s + ':') || here.startsWith(s + '/') || here === s.replace(/\/$/, ''));
  }

  /** Messaging that survives the extension being reloaded/updated while the page is open. */
  async function send(msg) {
    try {
      return await api.runtime.sendMessage(msg);
    } catch (err) {
      if (/context invalidated|receiving end does not exist/i.test(String(err && err.message))) stop();
      throw err;
    }
  }

  const onShortcut = e => {
    if (!e.altKey || !e.shiftKey) return;
    if (e.code === 'KeyM') { togglePanel(); e.preventDefault(); }
    if (e.code === 'KeyT' || e.code === 'KeyS') { setSubtitles(!state.subtitles, true); e.preventDefault(); }
    if (e.code === 'KeyL') { readAll(pageBtn && pageBtn.nextSibling); e.preventDefault(); }
  };
  const onScroll = () => { if (state.subtitles) placeSubtitles(); if (tip) tip.classList.remove('show'); highlight(null); };
  const onResize = () => state.subtitles && placeSubtitles();
  const onChange = () => collectLiterals();
  const onBlur = () => { highlight(null); setPassThrough(false); };
  const onVisibility = () => { if (!document.hidden && missedWhileHidden) { missedWhileHidden = false; scanSoon(); } };

  // Listeners exist only while the extension is active on the site (nothing runs elsewhere).
  const LISTENERS = [
    [document, 'mouseover', onOver, true],
    [document, 'mousemove', onMove, { capture: true, passive: true }],
    [document, 'focusin', onFocus, true],
    [document, 'touchstart', onTouchStart, { capture: true, passive: true }],
    [document, 'touchmove', onTouchMove, { capture: true, passive: true }],
    [document, 'touchend', onTouchEnd, { capture: true, passive: false }],
    [document, 'click', onClickCapture, true],
    [document, 'contextmenu', onContextMenu, true],
    [document, 'keydown', onModKey, true],
    [document, 'keyup', onModKey, true],
    [document, 'keydown', onShortcut, true],
    [document, 'change', onChange, true],
    [document, 'visibilitychange', onVisibility, false],
    [window, 'scroll', onScroll, { passive: true, capture: true }],
    [window, 'resize', onResize, { passive: true }],
    [window, 'blur', onBlur, false],
  ];
  let listening = false;
  function listen(on) {
    if (on === listening) return;
    listening = on;
    for (const [t, type, fn, opt] of LISTENERS) (on ? t.addEventListener : t.removeEventListener).call(t, type, fn, opt);
  }

  async function start() {
    const gen = ++state.gen;
    let settings;
    let pack;
    try {
      settings = await send({ type: 'getSettings' });
      if (gen !== state.gen) return;
      state.settings = settings;
      if (!siteEnabled(settings)) { stop(); return; }
      [pack, state.langs] = await Promise.all([send({ type: 'getPack', lang: settings.lang }), send({ type: 'getLangs' })]);
      if (gen !== state.gen) return;
    } catch (err) {
      console.warn('[Langwa] cannot reach the extension:', err && err.message);
      return;
    }
    player.stop();
    state.ui = uiMap(pack);
    if (!settings.lang) {
      // No language chosen yet: only the chooser, nothing else runs.
      state.active = false;
      listen(false);
      destroyUI();
      buildChooser();
      return;
    }
    state.pack = pack;
    state.engine = E.createEngine(pack);
    state.brands = pageBrands();
    state.results.clear();
    state.known = new WeakMap();
    state.units = [];
    state.unitsByEl = new Map();
    state.mtError = false;
    destroyUI();
    buildUI();
    if (state.panelOpen) togglePanel(true);
    state.active = true;
    state.startedAt = Date.now();
    listen(true);
    scan();
    if (settings.pageMode) setSubtitles(true); // page translation stays on between pages
    showFirstRunHint();
    if (!observer) {
      observer = new MutationObserver(muts => {
        // Ignore our own layer being attached.
        if (host && muts.every(m => m.target === host || (m.type === 'childList' && [...m.addedNodes, ...m.removedNodes].every(n => n === host)))) return;
        scanSoon();
      });
      observer.observe(document.documentElement, {
        subtree: true, childList: true, characterData: true, attributes: true,
        attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'open', 'placeholder', 'aria-label', 'title'],
      });
    }
  }

  function stop() {
    state.gen++;
    state.active = false;
    listen(false);
    try { player.stop(); } catch { /* ignore */ }
    if (observer) { observer.disconnect(); observer = null; }
    clearTimeout(scanTimer);
    scanTimer = null;
    destroyUI();
  }

  api.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.settings && !Object.keys(changes).some(k => k.startsWith('overrides:'))) {
      const before = changes.settings.oldValue || {};
      const after = changes.settings.newValue || {};
      const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
      const changed = [...keys].filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
      if (state.active && changed.length && changed.every(k => LIGHT_SETTINGS.includes(k))) {
        state.settings = { ...state.settings, ...after }; // voice or reading preference: no restart
        return;
      }
    }
    if (changes.settings || Object.keys(changes).some(k => k.startsWith('overrides:'))) start();
  });
  api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === 'ping') { sendResponse({ active: state.active }); return; }
    if (!state.active || !msg) return;
    if (msg.type === 'togglePanel') togglePanel();
    if (msg.type === 'toggleSubtitles' || msg.type === 'togglePage') setSubtitles(!state.subtitles, true);
    if (msg.type === 'readAll') readAll(pageBtn && pageBtn.nextSibling);
  });

  start();
})();
