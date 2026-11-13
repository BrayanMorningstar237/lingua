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

globalThis.LANGWA_DATA = {"source":{"about":"Source strings (French / English). Each national-language file (lang/<code>.json) maps an id to { t, verified, validator, audio }. {placeholders} are filled with the protected values from the page (amounts, names...) and MUST be kept in the translation. Strings marked \"check\": true were taken from an auto-translated view of the test page and must be compared with the page's real FR/EN text.","entries":[{"id":"gist_error","group":"safety-net","fr":"Ceci est un message d'erreur. L'opération n'a pas abouti.","en":"This is an error message. The operation did not go through.","note":"Phrase générale pour TOUTE nouvelle erreur inconnue : l’opération n’a pas marché."},{"id":"gist_warning","group":"safety-net","fr":"Avertissement de sécurité : lisez attentivement ou demandez de l'aide à une personne de confiance.","en":"Security warning: read carefully or ask someone you trust for help.","note":"Phrase générale utilisée pour TOUT nouvel avertissement de sécurité inconnu. Doit inviter à la prudence."},{"id":"gist_success","group":"safety-net","fr":"L'opération a réussi.","en":"The operation was successful."},{"id":"gist_info","group":"safety-net","fr":"Message d'information.","en":"Information message."},{"id":"gist_keywords","group":"safety-net","fr":"Mots clés :","en":"Key words:"},{"id":"test_banner","group":"test-env","fr":"Environnement de test : données fictives, aucune transaction réelle.","en":"Test environment: dummy data, no real transactions.","check":true,"variants":["Environnement de test — données fictives, aucune transaction réelle.","Test environment — dummy data, no real transactions."]},{"id":"test_protocol","group":"test-env","fr":"Protocole de test","en":"Test protocol","check":true},{"id":"back_hackathon","group":"test-env","fr":"Retour au hackathon","en":"Back to the hackathon","check":true},{"id":"online_banking","group":"test-env","fr":"Banque en ligne","en":"Online banking","check":true},{"id":"step_pay","group":"steps","fr":"Payer","en":"Pay","variants":["Paiement","Payment"],"note":"Étape 1 du parcours : payer / envoyer de l’argent. / Step 1 of the journey: paying."},{"id":"step_costs","group":"steps","fr":"Frais","en":"Fees","variants":["Costs"],"check":true,"note":"Étape où l’on voit ce que la banque prend pour l’opération. / Step showing what the bank charges."},{"id":"step_beneficiary","group":"steps","fr":"Bénéficiaire","en":"Beneficiary","note":"Étape où l’on dit qui reçoit l’argent. / Step where you say who receives the money."},{"id":"step_summary","group":"steps","fr":"Récapitulatif","en":"Summary","variants":["Résumé"]},{"id":"step_confirmation","group":"steps","fr":"Confirmation","en":"Confirmation"},{"id":"your_account","group":"balance","fr":"Votre compte","en":"Your account"},{"id":"hello_name","group":"balance","fr":"Bonjour, {name}","en":"Hello, {name}"},{"id":"intro_balance","group":"balance","fr":"Consultez votre solde et initiez un virement sécurisé.","en":"Check your balance and initiate a secure transfer.","check":true},{"id":"available_balance","group":"balance","fr":"Solde disponible","en":"Available balance","note":"L’argent que vous pouvez utiliser maintenant. / The money you can use right now."},{"id":"balance","group":"balance","fr":"Solde","en":"Balance","note":"L’argent qui est sur le compte. / The money in the account."},{"id":"account_number","group":"balance","fr":"Numéro de compte","en":"Account number","note":"Le numéro qui identifie le compte. / The number identifying the account."},{"id":"current_account","group":"balance","fr":"Compte courant","en":"Current account","note":"Le compte de tous les jours. / The everyday account."},{"id":"savings_account","group":"balance","fr":"Compte épargne","en":"Savings account"},{"id":"perform_transfer","group":"balance","fr":"Effectuer un virement","en":"Make a transfer","variants":["Perform a transfer","Faire un virement","Faire un transfert"],"check":true},{"id":"view_fees","group":"balance","fr":"Voir les frais","en":"View fees","check":true},{"id":"recent_transactions","group":"balance","fr":"Transactions récentes","en":"Recent transactions","variants":["Dernières opérations","Dernières transactions"],"check":true},{"id":"merchant_payment","group":"balance","fr":"Paiement marchand","en":"Merchant payment","check":true,"note":"Argent payé dans un magasin ou à un commerçant."},{"id":"salary_received","group":"balance","fr":"Salaire reçu","en":"Salary received","check":true,"note":"Le salaire est arrivé sur le compte (argent qui entre)."},{"id":"transfer_received","group":"balance","fr":"Virement reçu","en":"Transfer received","variants":["Transfert reçu"],"note":"Quelqu un vous a envoyé de l’argent (argent qui entre)."},{"id":"transfer_sent","group":"balance","fr":"Virement envoyé","en":"Transfer sent","variants":["Transfert envoyé"]},{"id":"electricity_bill","group":"balance","fr":"Facture d'électricité","en":"Electricity bill"},{"id":"water_bill","group":"balance","fr":"Facture d'eau","en":"Water bill"},{"id":"cash_withdrawal","group":"balance","fr":"Retrait d'espèces","en":"Cash withdrawal"},{"id":"deposit","group":"balance","fr":"Dépôt","en":"Deposit"},{"id":"airtime","group":"balance","fr":"Achat de crédit","en":"Airtime purchase"},{"id":"security","group":"security","fr":"Sécurité","en":"Security"},{"id":"security_check_beneficiary","group":"security","fr":"Vérifiez toujours le nom et le numéro du bénéficiaire avant de confirmer un virement.","en":"Always check the beneficiary's name and number before confirming a transfer.","check":true,"note":"Conseil de sécurité : regardez bien le nom et le numéro avant de valider."},{"id":"secure_connection","group":"security","fr":"Connexion sécurisée","en":"Secure connection"},{"id":"demo_footer","group":"security","fr":"Safinum Pay : environnement de démonstration. N'entrez aucune donnée personnelle réelle.","en":"Safinum Pay: demonstration environment. Do not enter any real personal data.","check":true,"variants":["Safinum Pay — environnement de démonstration. N'entrez aucune donnée personnelle réelle.","Safinum Pay — demonstration environment. Do not enter any real personal data."]},{"id":"never_share_pin","group":"security","fr":"Ne communiquez jamais votre code PIN, même à un agent de la banque.","en":"Never share your PIN, not even with a bank employee.","note":"Le code secret ne se donne à personne, même pas à quelqu’un de la banque. La négation est essentielle."},{"id":"fraud_warning","group":"security","fr":"Méfiez-vous des appels ou SMS qui vous demandent votre code secret.","en":"Beware of calls or text messages asking for your secret code.","note":"Si quelqu’un vous appelle pour demander votre code secret, c’est un voleur."},{"id":"irreversible","group":"security","fr":"Une fois confirmé, le virement ne peut pas être annulé.","en":"Once confirmed, the transfer cannot be cancelled.","note":"Après confirmation, impossible de récupérer l’argent. Le sens doit être très clair."},{"id":"check_details","group":"security","fr":"Vérifiez les informations avant de confirmer.","en":"Check the details before confirming."},{"id":"transfer_fees","group":"fees","fr":"Frais de virement","en":"Transfer fees","variants":["Frais de transfert"],"note":"Ce que la banque prend pour envoyer l’argent. / What the bank charges to send money."},{"id":"transaction_fees","group":"fees","fr":"Frais de transaction","en":"Transaction fees"},{"id":"fees","group":"fees","fr":"Frais","en":"Fees","variants":["Costs"],"note":"L’argent que la banque prend pour faire l’opération. / What the bank charges for the operation."},{"id":"choose_type_amount","group":"fees","fr":"Choisissez le type de virement et le montant. Les frais sont calculés automatiquement.","en":"Choose the transfer type and amount. Fees are calculated automatically.","check":true},{"id":"operation_type","group":"fees","fr":"Type d'opération","en":"Type of operation","variants":["Operation type"],"check":true},{"id":"safinum_account","group":"fees","fr":"Compte Safinum","en":"Safinum account","check":true},{"id":"instant_free","group":"fees","fr":"Virement instantané et gratuit","en":"Instant and free transfer","check":true,"note":"L’argent arrive tout de suite et la banque ne prend rien. / Arrives immediately, the bank charges nothing."},{"id":"other_bank","group":"fees","fr":"Compte d'une autre banque","en":"Account at another bank"},{"id":"mobile_money","group":"fees","fr":"Mobile Money","en":"Mobile Money"},{"id":"amount_to_send","group":"fees","fr":"Montant à envoyer","en":"Amount to send"},{"id":"amount","group":"fees","fr":"Montant","en":"Amount"},{"id":"free","group":"fees","fr":"Gratuit","en":"Free"},{"id":"total_debited","group":"fees","fr":"Total à débiter","en":"Total to be debited","variants":["Total débité","Total debited"],"check":true,"note":"Tout ce qui va sortir du compte : montant envoyé + frais. / Everything that will leave the account: amount + fees."},{"id":"balance_after","group":"fees","fr":"Solde après l'opération","en":"Balance after operation","variants":["Balance after the operation"],"check":true,"note":"L’argent qui restera sur le compte après cet envoi. / Money left after this transfer."},{"id":"fee_rate_min","group":"fees","fr":"{rate} du montant (minimum {min})","en":"{rate} of the amount (minimum {min})"},{"id":"beneficiary","group":"transfer","fr":"Bénéficiaire","en":"Beneficiary","note":"La personne qui va recevoir l’argent. / The person who will receive the money."},{"id":"beneficiary_name","group":"transfer","fr":"Nom du bénéficiaire","en":"Beneficiary name","variants":["Beneficiary's name","Name of the beneficiary"]},{"id":"phone_number","group":"transfer","fr":"Numéro de téléphone","en":"Phone number"},{"id":"account_or_phone","group":"transfer","fr":"Numéro de compte ou de téléphone","en":"Account or phone number"},{"id":"reason","group":"transfer","fr":"Motif","en":"Reason","variants":["Motif du virement","Purpose"]},{"id":"transfer_summary","group":"transfer","fr":"Récapitulatif du virement","en":"Transfer summary"},{"id":"send_amount_to","group":"transfer","fr":"Vous allez envoyer {amount} à {name}.","en":"You are about to send {amount} to {name}.","note":"Phrase de confirmation : qui reçoit et combien. Gardez {amount} et {name}. / Confirmation: who receives how much."},{"id":"pin_code","group":"transfer","fr":"Code PIN","en":"PIN code","variants":["PIN"],"note":"Le code secret de 4 chiffres. / The secret 4-digit code."},{"id":"enter_pin","group":"transfer","fr":"Saisissez votre code PIN","en":"Enter your PIN"},{"id":"accept_terms","group":"transfer","fr":"J'accepte les conditions générales.","en":"I accept the terms and conditions."},{"id":"terms","group":"transfer","fr":"Conditions générales","en":"Terms and conditions"},{"id":"back","group":"transfer","fr":"Retour","en":"Back"},{"id":"continue","group":"transfer","fr":"Continuer","en":"Continue"},{"id":"confirm","group":"transfer","fr":"Confirmer","en":"Confirm"},{"id":"confirm_transfer","group":"transfer","fr":"Confirmer le virement","en":"Confirm the transfer","variants":["Confirm transfer"]},{"id":"cancel","group":"transfer","fr":"Annuler","en":"Cancel"},{"id":"reference","group":"transfer","fr":"Référence","en":"Reference","note":"Le code de cette opération ; à donner si vous appelez la banque. / The code of this operation; give it if you call the bank."},{"id":"date","group":"transfer","fr":"Date","en":"Date"},{"id":"status","group":"transfer","fr":"Statut","en":"Status"},{"id":"transfer_success","group":"messages","fr":"Virement effectué avec succès.","en":"Transfer completed successfully.","variants":["Transfert effectué avec succès."]},{"id":"insufficient_balance","group":"messages","fr":"Solde insuffisant pour effectuer cette opération.","en":"Insufficient balance for this transaction.","variants":["Solde insuffisant.","Insufficient balance."],"note":"Il n’y a pas assez d’argent sur le compte pour cette opération."},{"id":"pin_incorrect_attempts","group":"messages","fr":"Code PIN incorrect. Il vous reste {count} tentatives.","en":"Incorrect PIN. You have {count} attempts left.","note":"Le code secret est faux ; dire combien d’essais restent avant blocage. Gardez {count}."},{"id":"pin_incorrect","group":"messages","fr":"Code PIN incorrect.","en":"Incorrect PIN."},{"id":"account_locked","group":"messages","fr":"Votre compte est temporairement bloqué.","en":"Your account is temporarily locked."},{"id":"service_apology","group":"messages","fr":"Nous sommes désolés.","en":"We're sorry.","variants":["We are sorry","We’re sorry"],"note":"A brief apology from the service, usually after a failed action. Keep it as an apology, not a generic information label."},{"id":"required_field","group":"messages","fr":"Ce champ est obligatoire.","en":"This field is required."},{"id":"invalid_amount","group":"messages","fr":"Montant invalide.","en":"Invalid amount."},{"id":"must_accept_terms","group":"messages","fr":"Vous devez accepter les conditions générales.","en":"You must accept the terms and conditions."},{"id":"session_expired","group":"messages","fr":"Votre session a expiré. Veuillez vous reconnecter.","en":"Your session has expired. Please log in again."},{"id":"network_error","group":"messages","fr":"Erreur réseau. Veuillez réessayer.","en":"Network error. Please try again."},{"id":"processing","group":"messages","fr":"Traitement en cours...","en":"Processing..."},{"id":"enter_recipient_info","group":"test-env","fr":"Saisissez les informations du destinataire. Vérifiez toujours le numéro avant de valider.","en":"Enter the recipient's information. Always check the number before submitting.","check":true},{"id":"new_beneficiary_warning","group":"test-env","fr":"Ce bénéficiaire n'a jamais été utilisé sur ce compte. Veuillez vérifier le numéro avant de continuer.","en":"This beneficiary has never been used on this account. Please verify the number before proceeding.","check":true,"note":"Mise en garde : vous n’avez jamais envoyé d’argent à cette personne ; vérifiez le numéro. Garder le ton d’avertissement."},{"id":"reason_for_transfer","group":"test-env","fr":"Motif du virement","en":"Reason for transfer","check":true,"note":"Pourquoi vous envoyez l’argent. / Why you are sending the money."},{"id":"note_optional","group":"test-env","fr":"Note (facultatif)","en":"Note (optional)","variants":["Note (facultative)"],"check":true},{"id":"checked_name_number","group":"test-env","fr":"J'ai vérifié le nom et le numéro du bénéficiaire.","en":"I checked the beneficiary's name and number.","check":true,"note":"La personne dit qu’elle a bien vérifié le nom et le numéro."},{"id":"check_info_before_confirm","group":"test-env","fr":"Vérifiez les informations avant de confirmer le virement.","en":"Check the information before confirming the transfer.","check":true},{"id":"phone","group":"test-env","fr":"Téléphone","en":"Phone"},{"id":"operation","group":"test-env","fr":"Opération","en":"Operation"},{"id":"confirm_info_correct","group":"test-env","fr":"Je confirme que les informations ci-dessus sont exactes.","en":"I confirm that the above information is correct.","check":true,"note":"La personne s’engage : les informations sont justes."},{"id":"modify","group":"test-env","fr":"Modifier","en":"Edit","variants":["To modify","Modify"],"check":true},{"id":"transfer_completed","group":"test-env","fr":"Virement effectué","en":"Transfer completed","check":true},{"id":"transfer_sent_success","group":"test-env","fr":"Votre virement a été envoyé avec succès.","en":"Your transfer has been sent successfully.","check":true},{"id":"status_success","group":"test-env","fr":"Succès","en":"Success","variants":["Réussi"]},{"id":"new_transfer","group":"test-env","fr":"Nouveau virement","en":"New transfer","variants":["Nouveau transfert"]},{"id":"services_payment","group":"test-env","fr":"Paiement de services","en":"Payment for services"},{"id":"error","group":"messages","fr":"Erreur","en":"Error"},{"id":"warning","group":"messages","fr":"Attention","en":"Warning"},{"id":"ui_translating","group":"ui","fr":"Traduction en cours…","en":"Translating…"},{"id":"ui_protected","group":"ui","fr":"Valeur protégée, identique à la page","en":"Protected value, same as on the page"},{"id":"ui_validated","group":"ui","fr":"Validé","en":"Validated"},{"id":"ui_auto","group":"ui","fr":"Non validé","en":"Not validated"},{"id":"ui_summary","group":"ui","fr":"Résumé sûr","en":"Safe summary"},{"id":"ui_blocked","group":"ui","fr":"Bloqué : montant différent","en":"Blocked: amount mismatch"},{"id":"ui_missing","group":"ui","fr":"Pas encore traduit","en":"Not translated yet"},{"id":"ui_important","group":"ui","fr":"Messages importants","en":"Important messages"},{"id":"ui_page","group":"ui","fr":"Sur cette page","en":"On this page"},{"id":"ui_new","group":"ui","fr":"NOUVEAU","en":"NEW"},{"id":"ui_listen","group":"ui","fr":"Écouter","en":"Listen"},{"id":"ui_no_audio","group":"ui","fr":"Pas encore d’audio","en":"No audio yet"},{"id":"ui_subtitles","group":"ui","fr":"Sous-titres","en":"Subtitles"},{"id":"ui_close","group":"ui","fr":"Fermer","en":"Close"},{"id":"ui_drag_hint","group":"ui","fr":"Glisser pour déplacer · double-clic pour replacer","en":"Drag to move · double-click to reset"},{"id":"ui_empty","group":"ui","fr":"Rien à traduire ici","en":"Nothing to translate here"},{"id":"ui_mt_down","group":"ui","fr":"Traduction automatique indisponible : le texte reste non traduit","en":"Machine translation unavailable: unmatched text remains untranslated"},{"id":"ui_hint_hover","group":"ui","fr":"Maintenez Ctrl et pointez un texte : sa traduction s’affiche dessous.","en":"Hold Ctrl and point at any text: its translation appears below."},{"id":"ui_hint_hover_short","group":"ui","fr":"survol = traduction","en":"hover = translation"},{"id":"ui_hint_listen","group":"ui","fr":"Puis appuyez sur Espace pour écouter.","en":"Then press Space to listen."},{"id":"ui_ok","group":"ui","fr":"Compris","en":"Got it"},{"id":"ui_tagline","group":"ui","fr":"Banque en langues nationales","en":"Banking in national languages"},{"id":"ui_active","group":"ui","fr":"Actif sur ce site","en":"Active on this site"},{"id":"ui_unsupported","group":"ui","fr":"Page non prise en charge","en":"Page not supported"},{"id":"ui_reload_msg","group":"ui","fr":"Rechargez la page pour afficher les traductions.","en":"Reload the page to show the translations."},{"id":"ui_reload","group":"ui","fr":"Recharger","en":"Reload"},{"id":"ui_language","group":"ui","fr":"Langue","en":"Language"},{"id":"ui_show","group":"ui","fr":"Afficher la traduction","en":"Show the translation"},{"id":"ui_mode_ctrl","group":"ui","fr":"+ survol","en":"+ hover"},{"id":"ui_mode_hover","group":"ui","fr":"Survol","en":"Hover"},{"id":"ui_mode_off","group":"ui","fr":"Non","en":"Off"},{"id":"ui_panel","group":"ui","fr":"Panneau","en":"Panel"},{"id":"ui_settings","group":"ui","fr":"Glossaire, voix et paramètres","en":"Glossary, voice and settings"},{"id":"ui_choose","group":"ui","fr":"Quelle langue parlez-vous ?","en":"Which language do you speak?"},{"id":"ui_choose_sub","group":"ui","fr":"Langwa affichera la banque dans cette langue.","en":"Langwa will show the bank in this language."},{"id":"ui_soon","group":"ui","fr":"Bientôt","en":"Soon"},{"id":"ui_later","group":"ui","fr":"Plus tard","en":"Later"},{"id":"ui_hint_touch","group":"ui","fr":"Appuyez longuement sur un texte : sa traduction s’affiche dessous.","en":"Long press any text: its translation appears below."},{"id":"ui_hint_touch_short","group":"ui","fr":"appui long = traduction","en":"long press = translation"},{"id":"ui_missing_lang","group":"ui","fr":"Pas encore traduit en {lang}","en":"Not yet translated into {lang}"},{"id":"ui_original","group":"ui","fr":"Original","en":"Original"},{"id":"ui_n_ok","group":"ui","fr":"validées","en":"validated"},{"id":"ui_n_mt","group":"ui","fr":"non validées","en":"not validated"},{"id":"ui_n_gist","group":"ui","fr":"résumés","en":"summaries"},{"id":"ui_n_block","group":"ui","fr":"bloquées","en":"blocked"},{"id":"ui_n_none","group":"ui","fr":"non traduites","en":"not translated"},{"id":"ui_n_ok_one","group":"ui","fr":"validée","en":"validated"},{"id":"ui_n_mt_one","group":"ui","fr":"non validée","en":"not validated"},{"id":"ui_n_gist_one","group":"ui","fr":"résumé","en":"summary"},{"id":"ui_n_block_one","group":"ui","fr":"bloquée","en":"blocked"},{"id":"ui_n_none_one","group":"ui","fr":"non traduite","en":"not translated"},{"id":"ui_voice_human","group":"ui","fr":"Voix humaine","en":"Human voice"},{"id":"ui_voice_neural","group":"ui","fr":"Voix neuronale","en":"Neural voice"},{"id":"ui_voice_synth","group":"ui","fr":"Voix de synthèse","en":"Synthetic voice"},{"id":"ui_voice_local","group":"ui","fr":"Voix locale","en":"Local voice"},{"id":"ui_voice_browser","group":"ui","fr":"Voix du navigateur","en":"Browser voice"},{"id":"ui_voice_preparing","group":"ui","fr":"Voix locale, préparation…","en":"Local voice, preparing…"},{"id":"ui_voice_why_offline","group":"ui","fr":"voix locale éteinte","en":"local voice is off"},{"id":"ui_voice_why_loading","group":"ui","fr":"voix locale en chargement","en":"local voice is loading"},{"id":"ui_voice_installing","group":"ui","fr":"voix naturelle","en":"natural voice"},{"id":"ui_voice_natural","group":"ui","fr":"Voix naturelle","en":"Natural voice"},{"id":"ui_voice_hint","group":"ui","fr":"Voix du navigateur. Pour une voix plus naturelle, lancez « Start Langwa voice » sur cet ordinateur.","en":"Browser voice. For a more natural voice, start “Start Langwa voice” on this computer."},{"id":"ui_voice_starting","group":"ui","fr":"voix naturelle, démarrage…","en":"natural voice starting…"},{"id":"ui_voice_why_slow","group":"ui","fr":"voix locale trop lente","en":"local voice too slow"},{"id":"ui_voice_why_error","group":"ui","fr":"voix locale indisponible","en":"local voice unavailable"},{"id":"ui_stop","group":"ui","fr":"Arrêter","en":"Stop"},{"id":"ui_page_mode","group":"ui","fr":"Traduire la page","en":"Translate the page"},{"id":"ui_read_all","group":"ui","fr":"Tout lire","en":"Read all"},{"id":"ui_autoread","group":"ui","fr":"Lecture automatique","en":"Read aloud automatically"},{"id":"ui_autoread_sub","group":"ui","fr":"Lit la traduction dès qu’elle s’affiche","en":"Reads the translation as soon as it appears"},{"id":"ui_space_listen","group":"ui","fr":"écouter","en":"listen"},{"id":"ui_hint_listen_touch","group":"ui","fr":"Touchez Écouter pour entendre la traduction.","en":"Tap Listen to hear the translation."},{"id":"ui_dict_words","group":"ui","fr":"Mots du dictionnaire (non validés)","en":"Dictionary words (not validated)"},{"id":"ui_online_voice","group":"ui","fr":"Voix naturelles en ligne","en":"Natural online voices"},{"id":"ui_online_voice_sub","group":"ui","fr":"Plus fluide. Le texte lu est envoyé à Microsoft ou Google.","en":"More fluent. The text read is sent to Microsoft or Google."},{"id":"ui_online_ask","group":"ui","fr":"Voix plus naturelle ?","en":"A more natural voice?"},{"id":"ui_enable","group":"ui","fr":"Activer","en":"Turn on"},{"id":"ui_no_thanks","group":"ui","fr":"Non merci","en":"No thanks"},{"id":"ui_brand","group":"ui","fr":"Nom propre, non traduit","en":"Proper name, not translated"},{"id":"ui_tab_chat","group":"ui","fr":"Assistant","en":"Ask"},{"id":"ui_tab_msgs","group":"ui","fr":"Messages","en":"Messages"},{"id":"ui_ask_placeholder","group":"ui","fr":"Posez votre question…","en":"Ask your question…"},{"id":"ui_mic","group":"ui","fr":"Parler","en":"Speak"},{"id":"ui_send","group":"ui","fr":"Envoyer","en":"Send"},{"id":"ui_listening","group":"ui","fr":"J’écoute…","en":"Listening…"},{"id":"ui_switch_to","group":"ui","fr":"Passer en {lang}","en":"Switch to {lang}"},{"id":"q_page","group":"ui","fr":"C’est quoi cette page ?","en":"What is this page?"},{"id":"q_amount","group":"ui","fr":"Combien je vais payer ?","en":"How much will I pay?"},{"id":"q_receiver","group":"ui","fr":"Qui reçoit l’argent ?","en":"Who receives the money?"},{"id":"q_warning","group":"ui","fr":"Y a-t-il un danger ?","en":"Is there any danger?"},{"id":"q_next","group":"ui","fr":"Je fais quoi maintenant ?","en":"What do I do now?"},{"id":"ans_welcome","group":"ui","fr":"Bonjour ! Posez-moi une question sur cette page, en écrivant ou à voix haute.","en":"Hello! Ask me a question about this page, by typing or out loud."},{"id":"ans_page","group":"ui","fr":"Cette page : {title}.","en":"This page: {title}."},{"id":"ans_page_account","group":"ui","fr":"Voici le récapitulatif du compte : solde disponible et opérations récentes.","en":"This is your account overview. It shows your available balance and recent transactions."},{"id":"ans_page_costs","group":"ui","fr":"Vous êtes à l’étape des frais. Choisissez le type et le montant, puis vérifiez les frais avant de continuer.","en":"This is the costs step. Choose the transfer type and amount, then check the fee before continuing."},{"id":"ans_page_beneficiary","group":"ui","fr":"Vous êtes à l’étape du bénéficiaire. Saisissez puis vérifiez son nom et son numéro avant de continuer.","en":"This is the beneficiary step. Enter and check the recipient’s name and number before continuing."},{"id":"ans_page_summary","group":"ui","fr":"Voici le récapitulatif du virement. Vérifiez le montant, les frais, le bénéficiaire et son numéro avant de confirmer.","en":"This is the transfer summary. Check the amount, fees, recipient, and phone number before confirming."},{"id":"ans_page_confirmation","group":"ui","fr":"Vous êtes à l’étape de confirmation. Relisez les détails et confirmez seulement s’ils sont corrects.","en":"This is the confirmation step. Review the transfer details, then confirm only if they are correct."},{"id":"ans_page_complete","group":"ui","fr":"Le virement est terminé. Cette page indique son montant, son bénéficiaire et son statut.","en":"The transfer is complete. This page shows its amount, recipient, and status."},{"id":"ans_transfer_steps","group":"ui","fr":"Un virement comporte cinq étapes : payer, frais, bénéficiaire, récapitulatif et confirmation. Vérifiez chaque information avant de confirmer.","en":"A transfer has five steps: Pay, Costs, Beneficiary, Summary, and Confirmation. Check each detail before confirming."},{"id":"ans_amount","group":"ui","fr":"Montant total : {total}.","en":"Total amount: {total}."},{"id":"ans_fees","group":"ui","fr":"Frais : {fees}.","en":"Fees: {fees}."},{"id":"ans_no_amount","group":"ui","fr":"Je ne vois pas de montant sur cette page.","en":"I do not see an amount on this page."},{"id":"ans_receiver","group":"ui","fr":"L’argent va à {name}.","en":"The money goes to {name}."},{"id":"ans_no_receiver","group":"ui","fr":"Je ne vois pas encore de bénéficiaire sur cette page.","en":"I do not see a beneficiary on this page yet."},{"id":"ans_warning","group":"ui","fr":"Attention : {message}","en":"Warning: {message}"},{"id":"ans_no_warning","group":"ui","fr":"Pas d’alerte sur cette page.","en":"No warning on this page."},{"id":"ans_next","group":"ui","fr":"Ensuite, appuyez sur {button}.","en":"Next, press {button}."},{"id":"ans_no_next","group":"ui","fr":"Je ne vois pas de bouton à appuyer.","en":"I do not see a button to press."},{"id":"ans_balance","group":"ui","fr":"Argent disponible : {balance}.","en":"Money available: {balance}."},{"id":"ans_unknown","group":"ui","fr":"Je peux répondre à ces questions :","en":"I can answer these questions:"},{"id":"ans_type_instead","group":"ui","fr":"Écrivez votre question ou touchez une question ci-dessous.","en":"Type your question or tap a question below."},{"id":"ans_lang_detected","group":"ui","fr":"Vous parlez {lang} ?","en":"Are you speaking {lang}?"},{"id":"ans_speech_consent","group":"ui","fr":"Pour comprendre votre voix, le navigateur envoie l’enregistrement au service de reconnaissance de Google (français, anglais, pidgin).","en":"To understand your voice, the browser sends the recording to Google’s speech service (French, English, Pidgin)."},{"id":"ans_model_note","group":"ui","fr":"Réponse d’un modèle local, à vérifier.","en":"Answer from a local model: please check."},{"id":"ui_preparing","group":"ui","fr":"Préparation…","en":"Preparing…"},{"id":"ui_still_preparing","group":"ui","fr":"Encore un instant…","en":"Almost ready…"},{"id":"ui_no_voice","group":"ui","fr":"Aucune voix disponible sur cet appareil","en":"No voice available on this device"},{"id":"ui_no_voice_short","group":"ui","fr":"Pas de voix","en":"No voice"},{"id":"ui_voice_why_none","group":"ui","fr":"aucune voix sur cet appareil","en":"no voice on this device"},{"id":"ui_thinking","group":"ui","fr":"Je réfléchis…","en":"Thinking…"},{"id":"ui_model_loading","group":"ui","fr":"Le modèle local démarre : la première réponse peut prendre une minute.","en":"The local model is starting: the first answer can take a minute."},{"id":"ui_transcribing","group":"ui","fr":"Je transcris votre voix…","en":"Transcribing your voice…"},{"id":"ui_transcribing_slow","group":"ui","fr":"Je transcris votre voix… (le modèle vocal démarre)","en":"Transcribing your voice… (the speech model is starting)"},{"id":"ui_listening_stop","group":"ui","fr":"J’écoute… touchez pour arrêter","en":"Listening… tap to stop"},{"id":"ans_model_timeout","group":"ui","fr":"Le modèle local met trop de temps. Voici ce que je peux dire sans lui :","en":"The local model is taking too long. Here is what I can tell you without it:"},{"id":"ans_no_speech","group":"ui","fr":"Je n’ai rien entendu. Touchez le micro et parlez, ou écrivez votre question.","en":"I did not hear anything. Tap the microphone and speak, or type your question."},{"id":"ans_mic_blocked","group":"ui","fr":"Le micro est bloqué. Autorisez-le dans la barre d’adresse du navigateur, ou écrivez votre question.","en":"The microphone is blocked. Allow it in the browser address bar, or type your question."},{"id":"ans_speech_network","group":"ui","fr":"La reconnaissance vocale a besoin d’internet. Écrivez votre question ou réessayez.","en":"Speech recognition needs the internet. Type your question or try again."},{"id":"ans_asr_down","group":"ui","fr":"Je n’ai pas pu transcrire votre voix (serveur vocal local éteint ?). Écrivez votre question.","en":"I could not transcribe your voice (is the local speech server off?). Type your question."},{"id":"tour_welcome_t","group":"ui","fr":"Bienvenue dans Langwa","en":"Welcome to Langwa"},{"id":"tour_welcome_b","group":"ui","fr":"Langwa vous montre cette page en {lang}, à lire et à écouter. Une visite rapide : moins d’une minute.","en":"Langwa shows you this page in {lang}, to read and to hear. A quick tour: less than a minute."},{"id":"tour_start","group":"ui","fr":"Commencer la visite","en":"Start the tour"},{"id":"tour_point_t","group":"ui","fr":"Maintenez Ctrl et pointez un texte","en":"Hold Ctrl and point at a text"},{"id":"tour_point_touch_t","group":"ui","fr":"Appuyez longuement sur un texte","en":"Press and hold a text"},{"id":"tour_point_b","group":"ui","fr":"Sa traduction s’affiche juste dessous, avec le bouton Écouter. Les montants et les noms restent exactement ceux de la page.","en":"Its translation appears right below, with a Listen button. Amounts and names stay exactly as on the page."},{"id":"tour_fab_t","group":"ui","fr":"Le bouton Langwa","en":"The Langwa button"},{"id":"tour_fab_b","group":"ui","fr":"Il ouvre le panneau. Le chiffre rouge compte les messages importants de la page.","en":"It opens the panel. The red number counts the important messages on the page."},{"id":"tour_ask_t","group":"ui","fr":"Posez votre question","en":"Ask your question"},{"id":"tour_ask_b","group":"ui","fr":"Touchez une question toute prête, écrivez, ou touchez le micro et parlez. Langwa répond dans votre langue, avec les montants de la page.","en":"Tap a ready-made question, type, or tap the microphone and speak. Langwa answers in your language, with the page’s own amounts."},{"id":"tour_read_t","group":"ui","fr":"Écoutez toute la page","en":"Listen to the whole page"},{"id":"tour_read_b","group":"ui","fr":"Langwa lit la page à voix haute, les messages importants d’abord.","en":"Langwa reads the page aloud, important messages first."},{"id":"tour_page_t","group":"ui","fr":"Traduisez toute la page","en":"Translate the whole page"},{"id":"tour_page_b","group":"ui","fr":"La traduction s’affiche sur chaque texte de la page. Touchez encore pour revenir à l’original.","en":"The translation appears over every text on the page. Tap again to go back to the original."},{"id":"tour_voice_t","group":"ui","fr":"Qui lit à voix haute","en":"Who reads aloud"},{"id":"tour_voice_b","group":"ui","fr":"La voix du navigateur, ou la voix naturelle si elle est installée sur cet ordinateur. Son installation s’affiche ici en direct.","en":"The browser voice, or the natural voice if it is installed on this computer. Its installation shows here, live."},{"id":"tour_lang_t","group":"ui","fr":"Changez de langue","en":"Change language"},{"id":"tour_lang_b","group":"ui","fr":"À tout moment, ici. Les langues les plus complètes sont en premier.","en":"Any time, here. The most complete languages come first."},{"id":"tour_done_t","group":"ui","fr":"C’est prêt !","en":"You are ready!"},{"id":"tour_done_b","group":"ui","fr":"Pour revoir ce guide : le bouton Guide en bas du panneau, ou la fenêtre Langwa dans la barre du navigateur.","en":"To see this guide again: the Guide button at the bottom of the panel, or the Langwa window in the browser toolbar."},{"id":"tour_finish","group":"ui","fr":"Terminer","en":"Finish"},{"id":"tour_next","group":"ui","fr":"Suivant","en":"Next"},{"id":"tour_back","group":"ui","fr":"Retour","en":"Back"},{"id":"tour_skip","group":"ui","fr":"Passer le guide","en":"Skip the guide"},{"id":"tour_replay","group":"ui","fr":"Revoir le guide","en":"See the guide again"},{"id":"tour_guide","group":"ui","fr":"Guide","en":"Guide"},{"id":"q_steps","group":"ui","fr":"Quelles sont les étapes du virement ?","en":"What are the transfer steps?"},{"id":"ans_steps","group":"ui","fr":"Un virement a cinq étapes. Payer lance le virement. Frais : choisissez le type et le montant, et vérifiez les frais. Bénéficiaire : le nom et le numéro de téléphone de la personne qui reçoit. Récapitulatif : vérifiez tout. Confirmation : le virement part seulement quand vous confirmez.","en":"A transfer has five steps. Pay starts the transfer. Costs lets you choose the type and amount and check the fee. Beneficiary asks for the recipient name and phone number. Summary lets you review the details. Confirmation sends it only after you confirm."},{"id":"ans_no_button","group":"ui","fr":"Je ne vois pas de bouton à appuyer.","en":"I do not see a button to press."},{"id":"ans_no_balance","group":"ui","fr":"Je ne vois pas de solde disponible sur cette page.","en":"I do not see an available balance on this page."},{"id":"ui_voice_not_ready","group":"ui","fr":"Voix pas prête","en":"Voice not ready"},{"id":"ui_voice_setup","group":"ui","fr":"Installer","en":"Set up"},{"id":"ui_voice_online","group":"ui","fr":"Voix naturelle en ligne","en":"Online natural voice"},{"id":"ui_voice_online_short","group":"ui","fr":"Voix en ligne","en":"Online voice"},{"id":"ui_voice_choose","group":"ui","fr":"Choisir","en":"Choose"},{"id":"ui_vfix_title","group":"ui","fr":"Une voix plus naturelle","en":"A more natural voice"},{"id":"ui_vfix_online","group":"ui","fr":"Utiliser la voix naturelle en ligne","en":"Use the online natural voice"},{"id":"ui_vfix_online_sub","group":"ui","fr":"Tout de suite. Le texte lu est envoyé à Microsoft ou Google.","en":"Right away. The text read aloud is sent to Microsoft or Google."},{"id":"ui_vfix_stop","group":"ui","fr":"Arrêter la voix en ligne","en":"Stop the online voice"},{"id":"ui_vfix_stop_sub","group":"ui","fr":"Revenir à la voix intégrée de cet appareil.","en":"Go back to this device's built-in voice."},{"id":"ui_vfix_offline","group":"ui","fr":"Installer la voix naturelle hors ligne","en":"Install the offline natural voice"},{"id":"ui_vfix_offline_sub","group":"ui","fr":"Privée, sur cet ordinateur. Environ 700 Mo, une seule fois.","en":"Private, on this computer. About 700 MB, once."},{"id":"ui_vfix_no_online","group":"ui","fr":"Ce navigateur n’a pas de voix en ligne. Edge en propose de très naturelles.","en":"This browser has no online voices. Edge offers very natural ones."}]},"langs":{"ewo":{"name":"Ewondo (Beti)","region":"Centre · Yaoundé, Mbalmayo","nllb":null,"mms":null,"refs":[{"name":"Wiktionnaire (éwondo)","url":"https://fr.wiktionary.org/wiki/Cat%C3%A9gorie:%C3%A9wondo"},{"name":"Wiktionary (Ewondo)","url":"https://en.wiktionary.org/wiki/Category:Ewondo_lemmas"}],"africaTts":"ewo","search":"ewondo beti yaounde yaoundé mbalmayo centre"},"fub":{"name":"Fulfulde (Peul / Fulani)","region":"Nord, Adamaoua, Extrême-Nord · Garoua, Ngaoundéré, Maroua","nllb":"fuv_Latn","mms":"ful","refs":[{"name":"Wiktionnaire (peul)","url":"https://fr.wiktionary.org/wiki/Cat%C3%A9gorie:peul"},{"name":"Wiktionary (Fula)","url":"https://en.wiktionary.org/wiki/Category:Fula_lemmas"}],"africaTts":"fub","search":"fulfulde foulfoulde foulfouldé peul peuhl fula fulani pulaar mbororo bororo garoua ngaoundere maroua nord adamaoua"},"wes":{"name":"Pidgin (Kamtok)","region":"Nord-Ouest, Sud-Ouest, Littoral · Bamenda, Buea, Douala, et dans tout le pays","nllb":null,"mms":null,"voices":["en-NG","en-CM","en-GH","en-ZA","en"],"reading":"none","refs":[{"name":"Wikipedia: Cameroonian Pidgin","url":"https://en.wikipedia.org/wiki/Cameroonian_Pidgin_English"}],"africaTts":"pcm","search":"pidgin pidgin english kamtok broken english bamenda buea limbe douala anglophone"},"lns":{"name":"Lamnso' (Nso / Banso)","region":"Nord-Ouest · Kumbo, Bui","nllb":null,"mms":null,"voices":["ln","sw"],"reading":"none","refs":[{"name":"Flagship AI Cameroon translation models (draft MT, CC BY-NC 4.0)","url":"https://huggingface.co/flagship-ai/cameroon-int8"},{"name":"Cameroon Bibles parallel text dataset (CC BY 4.0; religious text, not banking vocabulary)","url":"https://huggingface.co/datasets/flagship-ai/cameroon_bibles"},{"name":"Lamnso' text-to-speech model (CC BY-NC 4.0; pronunciation model, not translation)","url":"https://huggingface.co/facebook/mms-tts-lns"}],"africaTts":null,"machineTranslation":true,"translationStatus":"Local LLM + corpus service required; unvalidated.","search":"lamnso lamso nso banso bansoa kumbo bui"},"dua":{"name":"Duala (Douala)","region":"Littoral · Douala","nllb":null,"mms":null,"refs":[{"name":"Wiktionnaire (douala)","url":"https://fr.wiktionary.org/wiki/Cat%C3%A9gorie:douala"},{"name":"Wiktionary (Duala)","url":"https://en.wiktionary.org/wiki/Category:Duala_lemmas"}],"africaTts":"dua","search":"duala douala sawa littoral"},"bbj":{"name":"Ghomálá' (Bamiléké)","region":"Ouest · Bafoussam, Bandjoun, Baham","nllb":null,"mms":null,"refs":[{"name":"Wiktionary (Ghomala')","url":"https://en.wiktionary.org/wiki/Category:Ghomala%27_lemmas"}],"africaTts":"bbj","search":"ghomala ghomálá bamileke bamiléké bandjoun bafoussam baham ouest"},"bas":{"name":"Basaá (Bassa)","region":"Centre, Littoral · Édéa, Eséka","nllb":null,"mms":null,"refs":[{"name":"Wiktionnaire (bassa)","url":"https://fr.wiktionary.org/wiki/Cat%C3%A9gorie:bassa_(Cameroun)"},{"name":"Wiktionary (Basaa)","url":"https://en.wiktionary.org/wiki/Category:Basaa_lemmas"}],"africaTts":"bas","search":"basaa bassa basa edea édéa eseka eséka"},"nge":{"name":"Mankon (Ngemba)","region":"Nord-Ouest · Bamenda, Mankon","nllb":null,"mms":null,"refs":[{"name":"Mankon Dictionary","url":"https://mankon-dictionary.vercel.app/"}],"africaTts":"nge","search":"mankon ngemba bamenda nord-ouest"},"bkm":{"name":"Kom","region":"Nord-Ouest · Fundong, Njinikom, Belo","nllb":null,"mms":null,"refs":[{"name":"Kom writing system (Omniglot)","url":"https://omniglot.com/writing/kom.htm"},{"name":"Wiktionary (Kom)","url":"https://en.wiktionary.org/wiki/Category:Kom_(Cameroon)_lemmas"}],"africaTts":"bkm","search":"kom itanghi fundong njinikom belo boyo"}},"packs":{"ewo":{"code":"ewo","validation":{"validators":[],"method":"Native-speaker review in the glossary editor (options page). Each entry stores who validated it."},"entries":{}},"fub":{"code":"fub","validation":{"validators":[],"status":"DRAFT. Written with AI assistance (Claude) from general Fula knowledge and Wiktionnaire terms. NOT validated by a native speaker: every entry is shown to users as 'Non validé'. To be reviewed by Adamawa Fulfulde speakers through the contribution page and the glossary editor.","method":"Native-speaker review in the glossary editor (options page). Each entry stores who validated it."},"entries":{"gist_error":{"t":"Ɗum ko kabaaru juumre. Golle ɗee ngasaaki.","by":"Brouillon IA, à valider"},"gist_warning":{"t":"Reentino : jangu no feewi, maa naamno goɗɗo mo a hoolii.","by":"Brouillon IA, à valider"},"gist_success":{"t":"Golle ɗee ngasii.","by":"Brouillon IA, à valider"},"gist_info":{"t":"Kabaaru.","by":"Brouillon IA, à valider"},"gist_keywords":{"t":"Konguɗi :","by":"Brouillon IA, à valider"},"test_banner":{"t":"Nokku ƴeewndagol : ceede ɗee goongaaka, neldugo goonga walaa.","by":"Brouillon IA, à valider"},"test_protocol":{"t":"Laawol ƴeewndagol","by":"Brouillon IA, à valider"},"back_hackathon":{"t":"Rutto to hackathon","by":"Brouillon IA, à valider"},"online_banking":{"t":"Banke e internet","by":"Brouillon IA, à valider"},"step_pay":{"t":"Yoɓugo","by":"Brouillon IA, à valider"},"step_costs":{"t":"Njoɓdi","by":"Brouillon IA, à valider"},"step_beneficiary":{"t":"Jaɓoowo","by":"Brouillon IA, à valider"},"step_summary":{"t":"Ƴeewndol","by":"Brouillon IA, à valider"},"step_confirmation":{"t":"Tabbitingol","by":"Brouillon IA, à valider"},"your_account":{"t":"Konte maa","by":"Brouillon IA, à valider"},"hello_name":{"t":"Jam waali, {name}","by":"Brouillon IA, à valider"},"intro_balance":{"t":"Ndaar ceede maa, nde neldaa ceede e kisal.","by":"Brouillon IA, à valider"},"available_balance":{"t":"Ceede ɗe a waawi huutorgo","by":"Brouillon IA, à valider"},"balance":{"t":"Ceede maa","by":"Brouillon IA, à valider"},"account_number":{"t":"Limre konte","by":"Brouillon IA, à valider"},"current_account":{"t":"Konte nyalaade fuu","by":"Brouillon IA, à valider"},"perform_transfer":{"t":"Nelda ceede","by":"Brouillon IA, à valider"},"view_fees":{"t":"Ndaar njoɓdi","by":"Brouillon IA, à valider"},"recent_transactions":{"t":"Golle sakkitiiɗe","by":"Brouillon IA, à valider"},"merchant_payment":{"t":"Njoɓdi to jeeyoowo","by":"Brouillon IA, à valider"},"salary_received":{"t":"Ceede golle ngarii","by":"Brouillon IA, à valider"},"transfer_received":{"t":"Ceede neldaaɗe ngarii","by":"Brouillon IA, à valider"},"electricity_bill":{"t":"Njoɓdi kuuraŋ","by":"Brouillon IA, à valider"},"security":{"t":"Kisal","by":"Brouillon IA, à valider"},"security_check_beneficiary":{"t":"Ndaar innde e limre jaɓoowo saa'i fuu, hade a tabbitina neldugo.","by":"Brouillon IA, à valider"},"secure_connection":{"t":"Jokkondiral kisal","by":"Brouillon IA, à valider"},"demo_footer":{"t":"Safinum Pay : nokku ƴeewndagol. Taa winndu kabaruuji maa goonga.","by":"Brouillon IA, à valider"},"never_share_pin":{"t":"Taa hokku goɗɗo code PIN maa, hay goɗɗo banke.","by":"Brouillon IA, à valider"},"irreversible":{"t":"Si a tabbitinii, neldugo ngo waawaa firtaade.","by":"Brouillon IA, à valider"},"transfer_fees":{"t":"Njoɓdi neldugo","by":"Brouillon IA, à valider"},"fees":{"t":"Njoɓdi","by":"Brouillon IA, à valider"},"choose_type_amount":{"t":"Suɓo no neldirta e ceede ɗe neldataa. Njoɓdi hiisoto e hoore mum.","by":"Brouillon IA, à valider"},"operation_type":{"t":"No golle ngonri","by":"Brouillon IA, à valider"},"safinum_account":{"t":"Konte Safinum","by":"Brouillon IA, à valider"},"instant_free":{"t":"Neldugo jaawngo, njoɓdi walaa","by":"Brouillon IA, à valider"},"amount_to_send":{"t":"Ceede ɗe neldataa","by":"Brouillon IA, à valider"},"amount":{"t":"Ceede","by":"Brouillon IA, à valider"},"free":{"t":"Njoɓdi walaa","by":"Brouillon IA, à valider"},"total_debited":{"t":"Ceede fuu ɗe njaltata e konte maa","by":"Brouillon IA, à valider"},"balance_after":{"t":"Ceede keddotooɗe caggal neldugo","by":"Brouillon IA, à valider"},"beneficiary":{"t":"Jaɓoowo","by":"Brouillon IA, à valider"},"beneficiary_name":{"t":"Innde jaɓoowo","by":"Brouillon IA, à valider"},"phone_number":{"t":"Limre telefon","by":"Brouillon IA, à valider"},"phone":{"t":"Telefon","by":"Brouillon IA, à valider"},"reason_for_transfer":{"t":"Sabaabu neldugo","by":"Brouillon IA, à valider"},"note_optional":{"t":"Binndol (si a yiɗii)","by":"Brouillon IA, à valider"},"enter_recipient_info":{"t":"Winndu kabaruuji jaɓoowo. Ndaar limre ndee saa'i fuu hade a nelda.","by":"Brouillon IA, à valider"},"new_beneficiary_warning":{"t":"A neldaayno ceede e jaɓoowo oo e konte maa fay. Useko, ndaar limre makko hade a jokka.","by":"Brouillon IA, à valider"},"checked_name_number":{"t":"Mi ndaarii innde e limre jaɓoowo.","by":"Brouillon IA, à valider"},"check_info_before_confirm":{"t":"Ndaar kabaruuji ɗii hade a tabbitina neldugo.","by":"Brouillon IA, à valider"},"send_amount_to":{"t":"A neldata {amount} e {name}.","by":"Brouillon IA, à valider"},"reference":{"t":"Limre golle","by":"Brouillon IA, à valider"},"operation":{"t":"Golle","by":"Brouillon IA, à valider"},"confirm_info_correct":{"t":"Mi tabbitinii kabaruuji ɗii ngoongaaji.","by":"Brouillon IA, à valider"},"modify":{"t":"Waylu","by":"Brouillon IA, à valider"},"confirm_transfer":{"t":"Tabbitin neldugo","by":"Brouillon IA, à valider"},"confirm":{"t":"Tabbitin","by":"Brouillon IA, à valider"},"cancel":{"t":"Haɗu","by":"Brouillon IA, à valider"},"back":{"t":"Rutto","by":"Brouillon IA, à valider"},"continue":{"t":"Jokku","by":"Brouillon IA, à valider"},"transfer_completed":{"t":"Neldugo gasii","by":"Brouillon IA, à valider"},"transfer_sent_success":{"t":"Ceede maa neldaama no woodi.","by":"Brouillon IA, à valider"},"status":{"t":"No ngonri","by":"Brouillon IA, à valider"},"status_success":{"t":"Gasii","by":"Brouillon IA, à valider"},"new_transfer":{"t":"Neldugo kesum","by":"Brouillon IA, à valider"},"insufficient_balance":{"t":"Ceede maa njonaa ngam golle ɗee.","by":"Brouillon IA, à valider"},"pin_incorrect_attempts":{"t":"Code PIN boni. Ko keddi ma etaaje {count}.","by":"Brouillon IA, à valider"},"pin_incorrect":{"t":"Code PIN boni.","by":"Brouillon IA, à valider"},"error":{"t":"Juumre","by":"Brouillon IA, à valider"},"warning":{"t":"Reentino","by":"Brouillon IA, à valider"},"ui_tab_chat":{"t":"Naamno","by":"Brouillon IA, à valider"},"ui_tab_msgs":{"t":"Kabaruuji","by":"Brouillon IA, à valider"},"ui_ask_placeholder":{"t":"Naamno naamne maa…","by":"Brouillon IA, à valider"},"ui_mic":{"t":"Haal","by":"Brouillon IA, à valider"},"ui_send":{"t":"Nelda","by":"Brouillon IA, à valider"},"ui_listening":{"t":"Mi heɗii…","by":"Brouillon IA, à valider"},"ui_switch_to":{"t":"Waylu e {lang}","by":"Brouillon IA, à valider"},"q_page":{"t":"Ɗoo ko honɗum?","by":"Brouillon IA, à valider"},"q_amount":{"t":"Ceede no foti mi yoɓata?","by":"Brouillon IA, à valider"},"q_receiver":{"t":"Moye jaɓata ceede ɗee?","by":"Brouillon IA, à valider"},"q_warning":{"t":"Reentino woodi na?","by":"Brouillon IA, à valider"},"q_next":{"t":"Ko mi waɗata jooni?","by":"Brouillon IA, à valider"},"ans_welcome":{"t":"Jam waali! Naamno mi ko faati e ngol hello, winndu maa haal.","by":"Brouillon IA, à valider"},"ans_page":{"t":"Ɗoo ko: {title}.","by":"Brouillon IA, à valider"},"ans_page_account":{"t":"Doo ko kontu maa. E hollata ceede ɗe ngon-ɗaa jogii e kontu maa e transaksyon kesɗitɗi maa.","by":"Brouillon IA, à valider"},"ans_page_costs":{"t":"Ngon-ɗaa e njoɓdi. Suɓo sifaa neldude e adadu ceede, tee ƴeew njoɓdi hade maa yaahude yeeso.","by":"Brouillon IA, à valider"},"ans_page_beneficiary":{"t":"Ngon-ɗaa e jaɓoowo ceede. Winndu innde e tonngoode telefoon mum, tee ƴeew ɗum fuu hade maa yaahude yeeso.","by":"Brouillon IA, à valider"},"ans_page_summary":{"t":"Doo ko yeewndo neldude ceede. Ƴeew adadu ceede, njoɓdi, innde jaɓoowo e tonngoode mum hade maa tabbitinde.","by":"Brouillon IA, à valider"},"ans_page_confirmation":{"t":"Ngon-ɗaa e tabbitingol. Ƴeew kabaaruuji neldude ceede kadi, tee tabbitin so ɗi fuu feewi tan.","by":"Brouillon IA, à valider"},"ans_page_complete":{"t":"Neldude ceede timmi. Ngol hello hollata adadu ceede, jaɓoowo e ngonka mum.","by":"Brouillon IA, à valider"},"ans_transfer_steps":{"t":"Neldude ceede woodi jawdi 5: Yobugo, Njoɓdi, Jaɓoowo, Yeewndo, Tabbintingol. Ƴeew kabaaruuji fuu hade maa tabbitinde.","by":"Brouillon IA, à valider"},"ans_amount":{"t":"Ceede fuu ɗe njaltata: {total}.","by":"Brouillon IA, à valider"},"ans_fees":{"t":"Njoɓdi: {fees}.","by":"Brouillon IA, à valider"},"ans_no_amount":{"t":"Mi yi’aali ceede e ngol hello.","by":"Brouillon IA, à valider"},"ans_receiver":{"t":"Ceede ɗee njahan to {name}.","by":"Brouillon IA, à valider"},"ans_no_receiver":{"t":"Mi yi’aali jaɓoowo e ngol hello taho.","by":"Brouillon IA, à valider"},"ans_warning":{"t":"Reentino: {message}","by":"Brouillon IA, à valider"},"ans_no_warning":{"t":"Reentino walaa e ngol hello.","by":"Brouillon IA, à valider"},"ans_next":{"t":"Jooni, ñoƴƴu {button}.","by":"Brouillon IA, à valider"},"ans_no_next":{"t":"Mi yi’aali butoŋ.","by":"Brouillon IA, à valider"},"ans_balance":{"t":"Ceede ɗe a waawi huutorgo: {balance}.","by":"Brouillon IA, à valider"},"ans_unknown":{"t":"Mi waawi jaabaade ɗee naamne:","by":"Brouillon IA, à valider"},"ans_type_instead":{"t":"Winndu naamne maa maa suɓo naamne les.","by":"Brouillon IA, à valider"},"ans_lang_detected":{"t":"A haalata {lang}?","by":"Brouillon IA, à valider"},"ans_speech_consent":{"t":"Ngam faamde hoolo maa, browser oo nelday ɗum to Google (Farayse, Engeleere, Pidgin).","by":"Brouillon IA, à valider"},"ans_model_note":{"t":"Jaabawol ordinater: ndaar ɗum.","by":"Brouillon IA, à valider"}}},"wes":{"code":"wes","validation":{"validators":[],"status":"DRAFT. Cameroonian Pidgin English (Kamtok), written with AI assistance (Claude) in the English-based spelling common on WhatsApp. NOT validated by a native speaker: every entry is shown to users as 'Non validé' until a Cameroonian Pidgin speaker reviews it.","method":"Native-speaker review in the glossary editor (options page). Each entry stores who validated it."},"entries":{"gist_error":{"t":"Na error message dis. The thing no pass.","by":"Brouillon IA, à valider"},"gist_warning":{"t":"Warning for security: read am well well, or ask person wey you trust make e help you.","by":"Brouillon IA, à valider"},"gist_success":{"t":"The thing don pass fine.","by":"Brouillon IA, à valider"},"gist_info":{"t":"Na information message.","by":"Brouillon IA, à valider"},"gist_keywords":{"t":"Important words:","by":"Brouillon IA, à valider"},"test_banner":{"t":"Na test environment: all the data na fake, no real money di move.","by":"Brouillon IA, à valider"},"test_protocol":{"t":"How for do the test","by":"Brouillon IA, à valider"},"back_hackathon":{"t":"Go back for hackathon","by":"Brouillon IA, à valider"},"online_banking":{"t":"Bank for internet","by":"Brouillon IA, à valider"},"step_pay":{"t":"Pay","by":"Brouillon IA, à valider"},"step_costs":{"t":"See charges","by":"Brouillon IA, à valider"},"step_beneficiary":{"t":"Person wey go receive am","by":"Brouillon IA, à valider"},"step_summary":{"t":"Check all tindem","by":"Brouillon IA, à valider"},"step_confirmation":{"t":"Confirm","by":"Brouillon IA, à valider"},"your_account":{"t":"Your account","by":"Brouillon IA, à valider"},"hello_name":{"t":"Hello, {name}","by":"Brouillon IA, à valider"},"intro_balance":{"t":"Check how much money you get, and send money with security.","by":"Brouillon IA, à valider"},"available_balance":{"t":"Money wey you fit use now","by":"Brouillon IA, à valider"},"balance":{"t":"Money wey dey your account","by":"Brouillon IA, à valider"},"account_number":{"t":"Account number","by":"Brouillon IA, à valider"},"current_account":{"t":"Account for everyday","by":"Brouillon IA, à valider"},"savings_account":{"t":"Account for save money","by":"Brouillon IA, à valider"},"perform_transfer":{"t":"Send money","by":"Brouillon IA, à valider"},"view_fees":{"t":"Look the charges","by":"Brouillon IA, à valider"},"recent_transactions":{"t":"Last things wey you do for your account","by":"Brouillon IA, à valider"},"merchant_payment":{"t":"Money wey you pay for shop","by":"Brouillon IA, à valider"},"salary_received":{"t":"Salary don enter","by":"Brouillon IA, à valider"},"transfer_received":{"t":"Money wey person send you don enter","by":"Brouillon IA, à valider"},"transfer_sent":{"t":"Money wey you send","by":"Brouillon IA, à valider"},"electricity_bill":{"t":"Light bill","by":"Brouillon IA, à valider"},"water_bill":{"t":"Water bill","by":"Brouillon IA, à valider"},"cash_withdrawal":{"t":"Money wey you comot","by":"Brouillon IA, à valider"},"deposit":{"t":"Money wey you put inside","by":"Brouillon IA, à valider"},"airtime":{"t":"Buy credit","by":"Brouillon IA, à valider"},"security":{"t":"Security","by":"Brouillon IA, à valider"},"security_check_beneficiary":{"t":"Always check the name and number of the person wey go receive am, before you confirm the transfer.","by":"Brouillon IA, à valider"},"secure_connection":{"t":"Connection wey get security","by":"Brouillon IA, à valider"},"demo_footer":{"t":"Safinum Pay: na test environment. No put your real personal information.","by":"Brouillon IA, à valider"},"never_share_pin":{"t":"No ever give your PIN to anybody, even person wey work for bank.","by":"Brouillon IA, à valider"},"fraud_warning":{"t":"Watch out for call or SMS wey di ask your secret code.","by":"Brouillon IA, à valider"},"irreversible":{"t":"When you don confirm, you no fit cancel the transfer again.","by":"Brouillon IA, à valider"},"check_details":{"t":"Check all the information before you confirm.","by":"Brouillon IA, à valider"},"transfer_fees":{"t":"Charges for send money","by":"Brouillon IA, à valider"},"transaction_fees":{"t":"Charges for the transaction","by":"Brouillon IA, à valider"},"fees":{"t":"Charges","by":"Brouillon IA, à valider"},"choose_type_amount":{"t":"Choose how you want send and how much. The charges go calculate by ei self.","by":"Locuteur natif (Cameroun)","verified":true,"validator":"Locuteur natif camerounais (équipe Langwa)","date":"2026-11-12"},"operation_type":{"t":"Which kind operation","by":"Brouillon IA, à valider"},"safinum_account":{"t":"Safinum account","by":"Brouillon IA, à valider"},"instant_free":{"t":"The money go reach quick quick, and e free","by":"Brouillon IA, à valider"},"other_bank":{"t":"Account for another bank","by":"Brouillon IA, à valider"},"mobile_money":{"t":"Mobile Money","by":"Brouillon IA, à valider"},"amount_to_send":{"t":"How much you want send","by":"Brouillon IA, à valider"},"amount":{"t":"How much","by":"Brouillon IA, à valider"},"free":{"t":"Free","by":"Brouillon IA, à valider"},"total_debited":{"t":"All the money wey go comot for your account","by":"Brouillon IA, à valider"},"balance_after":{"t":"Money wey go remain after","by":"Brouillon IA, à valider"},"fee_rate_min":{"t":"{rate} of the money (at least {min})","by":"Brouillon IA, à valider"},"beneficiary":{"t":"Person wey go receive am","by":"Brouillon IA, à valider"},"beneficiary_name":{"t":"Name of the person wey go receive am","by":"Brouillon IA, à valider"},"phone_number":{"t":"Phone number","by":"Brouillon IA, à valider"},"account_or_phone":{"t":"Account number or phone number","by":"Brouillon IA, à valider"},"reason":{"t":"Why you di send","by":"Brouillon IA, à valider"},"transfer_summary":{"t":"All tindem wey you don enter for the transfer, so you fit confirm am","by":"Brouillon IA, à valider"},"send_amount_to":{"t":"You di go send {amount} give {name}.","by":"Brouillon IA, à valider"},"pin_code":{"t":"PIN code","by":"Brouillon IA, à valider"},"enter_pin":{"t":"Put your PIN","by":"Brouillon IA, à valider"},"accept_terms":{"t":"I agree with the conditions.","by":"Brouillon IA, à valider"},"terms":{"t":"Conditions","by":"Brouillon IA, à valider"},"back":{"t":"Go back","by":"Brouillon IA, à valider"},"continue":{"t":"Continue","by":"Brouillon IA, à valider"},"confirm":{"t":"Confirm","by":"Brouillon IA, à valider"},"confirm_transfer":{"t":"Confirm the transfer","by":"Brouillon IA, à valider"},"cancel":{"t":"Cancel","by":"Brouillon IA, à valider"},"reference":{"t":"Reference","by":"Brouillon IA, à valider"},"date":{"t":"Date","by":"Brouillon IA, à valider"},"status":{"t":"How e be","by":"Brouillon IA, à valider"},"transfer_success":{"t":"The transfer don pass fine.","by":"Brouillon IA, à valider"},"insufficient_balance":{"t":"Your money no reach for do this operation.","by":"Brouillon IA, à valider"},"pin_incorrect_attempts":{"t":"PIN no correct. You remain {count} try.","by":"Brouillon IA, à valider"},"pin_incorrect":{"t":"PIN no correct.","by":"Brouillon IA, à valider"},"account_locked":{"t":"Dem don block your account for small time.","by":"Brouillon IA, à valider"},"service_apology":{"t":"We sorry.","by":"Brouillon IA, à valider"},"required_field":{"t":"You must fill this place.","by":"Brouillon IA, à valider"},"invalid_amount":{"t":"This amount no correct.","by":"Brouillon IA, à valider"},"must_accept_terms":{"t":"You must agree with the conditions.","by":"Brouillon IA, à valider"},"session_expired":{"t":"Your time don finish. Log in again.","by":"Brouillon IA, à valider"},"network_error":{"t":"Network get problem. Try again.","by":"Brouillon IA, à valider"},"processing":{"t":"E di work...","by":"Brouillon IA, à valider"},"enter_recipient_info":{"t":"Put the information of the person wey go receive am. Always check the number before you send.","by":"Brouillon IA, à valider"},"new_beneficiary_warning":{"t":"You never send money give this person from this account before. Abeg check the number well before you continue.","by":"Brouillon IA, à valider"},"reason_for_transfer":{"t":"Why you di send the money","by":"Brouillon IA, à valider"},"note_optional":{"t":"Small note (if you want)","by":"Brouillon IA, à valider"},"checked_name_number":{"t":"I don check the name and number of the person wey go receive am.","by":"Brouillon IA, à valider"},"check_info_before_confirm":{"t":"Check the information before you confirm the transfer.","by":"Brouillon IA, à valider"},"phone":{"t":"Phone","by":"Brouillon IA, à valider"},"operation":{"t":"Operation","by":"Brouillon IA, à valider"},"confirm_info_correct":{"t":"I confirm say all the information for up na correct.","by":"Brouillon IA, à valider"},"modify":{"t":"Change am","by":"Brouillon IA, à valider"},"transfer_completed":{"t":"Transfer don finish","by":"Brouillon IA, à valider"},"transfer_sent_success":{"t":"Your money don go fine.","by":"Brouillon IA, à valider"},"status_success":{"t":"E don pass","by":"Brouillon IA, à valider"},"new_transfer":{"t":"New transfer","by":"Brouillon IA, à valider"},"services_payment":{"t":"Pay for service","by":"Brouillon IA, à valider"},"error":{"t":"Error","by":"Brouillon IA, à valider"},"warning":{"t":"Warning","by":"Brouillon IA, à valider"},"ui_translating":{"t":"E di translate…","by":"Brouillon IA, à valider"},"ui_protected":{"t":"Protected, e be same as for the page","by":"Brouillon IA, à valider"},"ui_validated":{"t":"Checked","by":"Brouillon IA, à valider"},"ui_auto":{"t":"No check yet","by":"Brouillon IA, à valider"},"ui_summary":{"t":"Safe summary","by":"Brouillon IA, à valider"},"ui_blocked":{"t":"Blocked: the money no match","by":"Brouillon IA, à valider"},"ui_missing":{"t":"No translate yet","by":"Brouillon IA, à valider"},"ui_important":{"t":"Important messages","by":"Brouillon IA, à valider"},"ui_page":{"t":"For this page","by":"Brouillon IA, à valider"},"ui_new":{"t":"NEW","by":"Brouillon IA, à valider"},"ui_listen":{"t":"Hear am","by":"Brouillon IA, à valider"},"ui_no_audio":{"t":"No voice yet","by":"Brouillon IA, à valider"},"ui_subtitles":{"t":"Subtitles","by":"Brouillon IA, à valider"},"ui_close":{"t":"Close","by":"Brouillon IA, à valider"},"ui_empty":{"t":"Nothing for translate here","by":"Brouillon IA, à valider"},"ui_mt_down":{"t":"Machine translation no dey available; text wey no get translation go stay as e be","by":"Brouillon IA, à valider"},"ui_hint_hover":{"t":"Hold Ctrl and point any word: the translation go show for under.","by":"Brouillon IA, à valider"},"ui_hint_hover_short":{"t":"point = translation","by":"Brouillon IA, à valider"},"ui_hint_listen":{"t":"Then press Space for hear am.","by":"Brouillon IA, à valider"},"ui_ok":{"t":"I don understand","by":"Brouillon IA, à valider"},"ui_tagline":{"t":"Bank for we own language","by":"Brouillon IA, à valider"},"ui_active":{"t":"E dey work for this site","by":"Brouillon IA, à valider"},"ui_unsupported":{"t":"E no fit work for this page","by":"Brouillon IA, à valider"},"ui_reload_msg":{"t":"Reload the page make the translation show.","by":"Brouillon IA, à valider"},"ui_reload":{"t":"Reload","by":"Brouillon IA, à valider"},"ui_language":{"t":"Language","by":"Brouillon IA, à valider"},"ui_show":{"t":"Show the translation","by":"Brouillon IA, à valider"},"ui_mode_ctrl":{"t":"+ point","by":"Brouillon IA, à valider"},"ui_mode_hover":{"t":"Point","by":"Brouillon IA, à valider"},"ui_mode_off":{"t":"Off","by":"Brouillon IA, à valider"},"ui_panel":{"t":"Panel","by":"Brouillon IA, à valider"},"ui_settings":{"t":"Words, voice and settings","by":"Brouillon IA, à valider"},"ui_choose":{"t":"Which language you di talk?","by":"Brouillon IA, à valider"},"ui_choose_sub":{"t":"Langwa go show the bank for this language.","by":"Brouillon IA, à valider"},"ui_soon":{"t":"No translation data yet","by":"Brouillon IA, à valider"},"ui_later":{"t":"After","by":"Brouillon IA, à valider"},"ui_hint_touch":{"t":"Press any word for long: the translation go show for under.","by":"Brouillon IA, à valider"},"ui_hint_touch_short":{"t":"press long = translation","by":"Brouillon IA, à valider"},"ui_missing_lang":{"t":"Dem never translate am for {lang}","by":"Brouillon IA, à valider"},"ui_original":{"t":"Original","by":"Brouillon IA, à valider"},"ui_n_ok":{"t":"checked","by":"Brouillon IA, à valider"},"ui_n_mt":{"t":"no check yet","by":"Brouillon IA, à valider"},"ui_n_gist":{"t":"summaries","by":"Brouillon IA, à valider"},"ui_n_block":{"t":"blocked","by":"Brouillon IA, à valider"},"ui_n_none":{"t":"no translate yet","by":"Brouillon IA, à valider"},"ui_n_ok_one":{"t":"checked","by":"Brouillon IA, à valider"},"ui_n_mt_one":{"t":"no check yet","by":"Brouillon IA, à valider"},"ui_n_gist_one":{"t":"summary","by":"Brouillon IA, à valider"},"ui_n_block_one":{"t":"blocked","by":"Brouillon IA, à valider"},"ui_n_none_one":{"t":"no translate yet","by":"Brouillon IA, à valider"},"ui_voice_human":{"t":"Real person voice","by":"Brouillon IA, à valider"},"ui_voice_neural":{"t":"Computer voice (neural)","by":"Brouillon IA, à valider"},"ui_voice_synth":{"t":"Computer voice","by":"Brouillon IA, à valider"},"ui_stop":{"t":"Stop","by":"Brouillon IA, à valider"},"ui_page_mode":{"t":"Translate the page","by":"Brouillon IA, à valider"},"ui_read_all":{"t":"Read everything","by":"Brouillon IA, à valider"},"ui_autoread":{"t":"Read by ei self","by":"Brouillon IA, à valider"},"ui_autoread_sub":{"t":"E go read the translation as e show","by":"Brouillon IA, à valider"},"ui_space_listen":{"t":"hear","by":"Brouillon IA, à valider"},"ui_hint_listen_touch":{"t":"Touch Hear am for hear the translation.","by":"Brouillon IA, à valider"},"ui_dict_words":{"t":"Words from dictionary (no check yet)","by":"Brouillon IA, à valider"},"ui_online_voice":{"t":"Natural voice for internet","by":"Brouillon IA, à valider"},"ui_online_voice_sub":{"t":"E sweet pass. The text go go Microsoft or Google.","by":"Brouillon IA, à valider"},"ui_online_ask":{"t":"You want voice wey sweet pass?","by":"Brouillon IA, à valider"},"ui_enable":{"t":"Put am on","by":"Brouillon IA, à valider"},"ui_no_thanks":{"t":"No, thank you","by":"Brouillon IA, à valider"},"ui_brand":{"t":"Na name, we no translate am","by":"Brouillon IA, à valider"},"ui_tab_chat":{"t":"Ask","by":"Brouillon IA, à valider"},"ui_tab_msgs":{"t":"Messages","by":"Brouillon IA, à valider"},"ui_ask_placeholder":{"t":"Ask your question…","by":"Brouillon IA, à valider"},"ui_mic":{"t":"Talk","by":"Brouillon IA, à valider"},"ui_send":{"t":"Send","by":"Brouillon IA, à valider"},"ui_listening":{"t":"I di listen…","by":"Brouillon IA, à valider"},"ui_switch_to":{"t":"Change to {lang}","by":"Brouillon IA, à valider"},"q_page":{"t":"Wetin dis page be?","by":"Brouillon IA, à valider"},"q_amount":{"t":"How much I go pay?","by":"Brouillon IA, à valider"},"q_receiver":{"t":"Who go receive the money?","by":"Brouillon IA, à valider"},"q_warning":{"t":"Any danger for here?","by":"Brouillon IA, à valider"},"q_next":{"t":"Wetin I go do now?","by":"Brouillon IA, à valider"},"ans_welcome":{"t":"Hello! Ask me anything about dis page, write am or talk am.","by":"Brouillon IA, à valider"},"ans_page":{"t":"Dis page na: {title}.","by":"Brouillon IA, à valider"},"ans_amount":{"t":"All the money wey go comot: {total}.","by":"Brouillon IA, à valider"},"ans_fees":{"t":"Charges: {fees}.","by":"Brouillon IA, à valider"},"ans_no_amount":{"t":"I no see any amount for dis page.","by":"Brouillon IA, à valider"},"ans_receiver":{"t":"The money go go give {name}.","by":"Brouillon IA, à valider"},"ans_no_receiver":{"t":"I never see the person wey go receive am for dis page.","by":"Brouillon IA, à valider"},"ans_warning":{"t":"Take care: {message}","by":"Brouillon IA, à valider"},"ans_no_warning":{"t":"No warning for dis page.","by":"Brouillon IA, à valider"},"ans_next":{"t":"Now, press {button}.","by":"Brouillon IA, à valider"},"ans_no_next":{"t":"I no see any button for press.","by":"Brouillon IA, à valider"},"ans_balance":{"t":"Money wey you fit use: {balance}.","by":"Brouillon IA, à valider"},"ans_unknown":{"t":"I fit answer these questions:","by":"Brouillon IA, à valider"},"ans_type_instead":{"t":"Write your question or touch one question for down.","by":"Brouillon IA, à valider"},"ans_lang_detected":{"t":"You di talk {lang}?","by":"Brouillon IA, à valider"},"ans_speech_consent":{"t":"For understand your voice, the browser go send the recording give Google (French, English, Pidgin).","by":"Brouillon IA, à valider"},"ans_model_note":{"t":"Na computer answer: check am well.","by":"Brouillon IA, à valider"},"q_steps":{"t":"Wetin be the transfer steps?","by":"Brouillon IA, à valider"}}},"lns":{"code":"lns","validation":{"validators":[],"status":"Automatic machine translation draft. Not validated by Lamnso' speakers. Review financial and safety wording before relying on it.","method":"Local Flagship AI Cameroon French-pivot MarianMT model; native-speaker validation is still required."},"entries":{}},"dua":{"code":"dua","validation":{"validators":[],"method":"Native-speaker review in the glossary editor (options page). Each entry stores who validated it."},"entries":{}},"bbj":{"code":"bbj","validation":{"validators":[],"method":"Native-speaker review in the glossary editor (options page). Each entry stores who validated it."},"entries":{}},"bas":{"code":"bas","validation":{"validators":[],"method":"Native-speaker review in the glossary editor (options page). Each entry stores who validated it."},"entries":{}},"nge":{"code":"nge","validation":{"validators":[],"method":"Native-speaker review in the glossary editor (options page). Each entry stores who validated it."},"entries":{}},"bkm":{"code":"bkm","validation":{"validators":[],"method":"Native-speaker review in the glossary editor (options page). Each entry stores who validated it."},"entries":{}}},"lexicon":{"licence":"Words from Wiktionnaire / Wiktionary contributors, CC BY-SA 4.0 (https://fr.wiktionary.org, https://en.wiktionary.org); Lamnso words learned from the Lamnso New Testament (flagship-ai/cameroon_bibles, CC BY 4.0) aligned with the King James Version (public domain). Dictionary hints, not validated.","fr":{"ewo":{"eau":["məndím"],"bonjour":["bembekiri"]},"fub":{"non":["ala"],"merci":["adjarama","tiyaabu"],"savoir":["annduude"],"connaitre":["annduude"],"aide":["ballal"],"travail":["ballal"],"eau":["ceeɗoojam","ndiyam","ndiiam"],"voleur":["gujjo"],"personne":["goɗɗo"],"mois":["lewru"]},"dua":{"acheter":["anda"],"savoir":["bía"],"vendre":["andisɛ"],"jour":["búńa"],"changer":["cenci","tukwa"],"travail":["ebolo"],"accepter":["koa"],"lire":["lánga"],"prendre":["lámba ńolo","no̱ngo̱ jangame̱n"],"dire":["kwála"],"lettre":["kálati"],"eau":["madíbá"],"personne":["moto"],"garder":["táta"],"payer":["sáwa"],"ouvrir":["télɛ"]},"bas":{"changer":["hɛ̀ŋlà"],"eau":["malép","màlep","màlep ma ɓâs"]},"bbj":{},"nge":{"eau":["ŋkyi"]},"bkm":{"eau":["mu"]},"lns":{"argent":["mbàm"],"payer":["làʼ"],"paiement":["làʼ"],"donner":["fò"],"prendre":["lì"],"envoyer":["tùm","tumen"],"envoi":["tùm","tumen"],"nom":["yír","yir"],"jour":["kishiíy"],"mois":["ŋwee"],"année":["kiyá"],"mille":["nsə̀kì","ansə̀kì"],"cent":["wií","ghii"],"acheter":["yùn"],"achat":["yùn"],"vendre":["fiìnè"],"voleur":["shóŋ","shòŋ"],"mensonge":["kimboʼtì","bóʼti"],"mentir":["kimboʼtì","bóʼti"],"demander":["dzə̀r"],"dire":["jii"],"entendre":["yú","yù"],"écouter":["yú","yù"],"voir":["yén","yèn"],"savoir":["kì","kìíy"],"connaître":["kì","kìíy"],"écrire":["ŋwàʼ","saŋen"],"bon":["juŋ"],"bien":["juŋ"],"mal":["bi"],"vrai":["ru"],"vérité":["ru"],"nouveau":["fíy"],"nouvelle":["fíy"],"ouvrir":["mvə̀ʼ"],"appeler":["yoŋ"],"appel":["yoŋ"],"main":["kiwó","wó"],"maison":["lav"],"maintenant":["lèn"],"beaucoup":["anín"],"peu":["shishàr"],"choisir":["shòʼ"],"entrer":["nə̀ə́"],"saisir":["nə̀ə́"],"venir":["wìy"],"aller":["dù","du"],"salaire":["vilaʼày"],"prix":["káv"],"pauvre":["ŋgeʼe","kitàn"],"riche":["bùʼ"],"peur":["fàn","fan"],"non":["yòʼ","bó"],"merci":["beèrì","beerì"],"paix":["nyaáŋ"],"langue":["làm","lám"]}},"en":{"ewo":{"water":["məndím"]},"fub":{"never":["abada","abadan","muk"],"no":["alaa","aldaa","walaa"],"person":["aaden","gimɗo","neɗɗo"],"total":["adadu","kawral"],"number":["adadu"],"before":["adaade"],"take":["addugol","laatagol","naɓugol"],"know":["anndugol"],"error":["ayiibe","faljere","hakkee"],"return":["artugol"],"help":["ballal","dankata","faabaade"],"letter":["bataake"],"after":["caggal","ontuma","ɓaawo"],"price":["coggu"],"stop":["darnugol","faddagol","haaɗugol"],"work":["darnugol","ciiwdi","golle"],"year":["duuɓi"],"free":["dimo","hettaare"],"mistake":["faljere"],"call":["ewnagol","innugol","noddugol"],"lie":["fenaande","waalagol"],"look":["fewtugol","nandude","nanndugol"],"all":["fow","haddu","kala"],"finish":["gaynugol","haaɗugol","joofugol"],"end":["gaynugol","haaɗugol","kattuba"],"succeed":["gaynugol","laatagol","lontagol"],"language":["haala","ɗemŋgal"],"message":["haala","nelal"],"hide":["gurii","suumugol"],"wait":["habbagol","tijjagol"],"quickly":["heña"],"name":["innde","innugol","toɗɗagol"],"now":["jonta"],"receive":["jaɓɓagol"],"give":["jonnugol"],"read":["jangude","janngugol"],"listen":["jentagol","ɗoftagol"],"merchant":["jula","yeeyoowo"],"money":["kaalisi"],"new":["keso"],"back":["kééci","ɓaawo","ɓaawoojo"],"month":["lewru"],"sell":["marsingol","soorugo","yeeyugol"],"remain":["luttugol"],"close":["maɓɓugo","moggo","takko"],"open":["maɓɓititgo","udditugol"],"keep":["marugol"],"good":["moƴƴo","suuraare"],"enter":["naatugol"],"see":["ndaarugol"],"send":["naɓugol","nelde"],"water":["ndiyam"],"salary":["ngeenaari"],"wage":["ngeenaari"],"success":["poolal","ɓantaare"],"reason":["sababu"],"date":["ribinoore","saanga"],"pay":["rentagol"],"refuse":["saltagol"],"lack":["sannugol","ŋakkugol"],"many":["sowre","ɗuuɗugol"],"buy":["soodgo","soodugol"],"secret":["suuraare"],"security":["suuraare"],"account":["tinndol"],"little":["tokooso"],"write":["winndugol"],"change":["waylugol"],"speak":["wowlugol"],"day":["ñallal","ñalaande"],"debt":["ñamaande"],"telephone":["ɓoggol"]},"dua":{"person":["moto"],"water":["madíbá"]},"bas":{"water":["malép"]},"bbj":{"good":["bùŋ","pəpúŋ"],"all":["awɛ́"],"open":["cwaə́'"],"lie":["cwánwə̀"],"secret":["càm"],"remain":["cʉ́'"],"look":["cʉ'","lé","mcʉ̀"],"send":["cyà"],"bad":["cwə̀pùŋ"],"day":["dzʉ̌","tyə́'"],"new":["cùŋ","sə́"],"never":["dà"],"sell":["fìŋ","syàp"],"speak":["ghɔ̀m","sò"],"language":["ghɔ̀m"],"work":["fà'"],"give":["há","pà'"],"help":["hé","kwítə́"],"ask":["hə́ŋ","ló"],"take":["kwí","kə̀","lə̀"],"call":["ké"],"read":["ké"],"enter":["kó"],"wage":["ló'"],"lack":["kɔ̀m"],"close":["kə̀ŋ","vì'"],"keep":["lwɔ̀'"],"finish":["mì"],"person":["mò"],"back":["lə̂","ŋka'tə̀"],"accept":["píŋ"],"before":["nə̂"],"wait":["pyáp"],"water":["shyə"],"buy":["syàp","yó"],"pay":["syàp"],"enough":["sàk"],"hide":["pɔ̀m","tʉ̀m","tʉ̀mnyə̀"],"thousand":["shǎ'"],"thief":["shǔŋ"],"no":["sɔ̀m"],"name":["tsǒ"],"many":["yɔ́m"],"write":["və̀"],"see":["yɔ́"],"know":["zhyə","zhyə́"],"money":["ŋkap"],"yes":["ə̌ŋ"],"steal":["zhʉ̀","ŋɛ́"]},"bkm":{"water":["mu","jva"],"quickly":["nyas"],"person":["wul"]},"nge":{},"lns":{"money":["mbàm"],"pay":["làʼ"],"give":["fò"],"take":["lì"],"send":["tùm","tumen"],"name":["yír","yir"],"day":["kishiíy"],"month":["ŋwee"],"year":["kiyá"],"thousand":["nsə̀kì","ansə̀kì"],"hundred":["wií","ghii"],"buy":["yùn"],"sell":["fiìnè"],"thief":["shóŋ","shòŋ"],"lie":["kimboʼtì","bóʼti"],"ask":["dzə̀r"],"say":["jii"],"hear":["yú","yù"],"see":["yén","yèn"],"know":["kì","kìíy"],"write":["ŋwàʼ","saŋen"],"good":["juŋ"],"evil":["bi"],"true":["ru"],"new":["fíy"],"open":["mvə̀ʼ"],"call":["yoŋ"],"hand":["kiwó","wó"],"house":["lav"],"now":["lèn"],"many":["anín"],"little":["shishàr"],"choose":["shòʼ"],"enter":["nə̀ə́"],"come":["wìy"],"go":["dù","du"],"wages":["vilaʼày"],"price":["káv"],"gold":["kisha"],"poor":["ŋgeʼe","kitàn"],"rich":["bùʼ"],"fear":["fàn","fan"],"no":["yòʼ","bó"],"thanks":["beèrì","beerì"],"peace":["nyaáŋ"],"language":["làm","lám"]}}}};
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
      // A generic "info" gist is not a translation and can easily mislead users
      // on arbitrary pages. Keep safe summaries for classified warnings/errors,
      // but leave ordinary unknown text explicitly untranslated.
      const kind = classify(clean);
      if (!kind) return null;
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
        if (session.onStop) session.onStop({ stopped: true, spoke: !!session.spoke });
      }
      if (root.speechSynthesis) root.speechSynthesis.cancel();
      session = null;
    }

    /** Plays an audio file. Resolves true if sound actually started, false otherwise. */
    const playUrl = (url, s) => new Promise(res => {
      const a = new Audio(url);
      s.audio = a;
      let started = false;
      a.onplaying = () => { started = true; s.spoke = true; };
      a.onended = () => res(true);
      a.onerror = () => res(started);
      a.play().catch(() => res(false));
    });

    /**
     * Speaks with a device or online voice. Resolves true if speech started. Two safety nets:
     * if nothing starts within 5 s (a voice that never loads) it gives up, and online Chrome
     * voices are nudged every 10 s (they otherwise go silent mid-sentence on long text).
     */
    const say = (text, voice, s) => new Promise(res => {
      if (!root.speechSynthesis || s.stopped || !text.trim()) return res(false);
      const u = new SpeechSynthesisUtterance(text);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'fr-FR';
      u.rate = 1;     // natural pace
      u.pitch = 1;
      let started = false, done = false;
      const finish = ok => { if (done) return; done = true; clearTimeout(watch); clearInterval(nudge); res(ok); };
      const watch = setTimeout(() => { if (!started) { root.speechSynthesis.cancel(); finish(false); } }, 5000);
      const nudge = voice && voice.localService === false
        ? setInterval(() => { if (root.speechSynthesis.speaking) { root.speechSynthesis.pause(); root.speechSynthesis.resume(); } }, 10000)
        : 0;
      u.onstart = () => { started = true; s.spoke = true; };
      u.onend = () => finish(true);
      u.onerror = () => finish(started);
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
      out.raw = steps; // kept so the voice can be decided again when Listen is pressed
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
      // Which kind of device voice speaks: an online natural voice (Microsoft, Google) or a built-in one.
      const srcOf = v => (v && v.localService === false ? 'online' : 'browser');
      // Consecutive pieces read by the same voice become ONE utterance: the sentence flows
      // instead of being spoken word group by word group.
      const allow = !!online();
      const fr = bestFrenchVoice(allow);
      const nat = nationalVoice(allow, language() || {});
      // Languages that say amounts in their own words (Pidgin): when the local model reads the
      // sentence, it reads the amounts and names too, so the whole sentence is ONE voice and one
      // flowing utterance instead of model / browser voice / model.
      const modelSentence = !!tts && (language() || {}).reading === 'none' && steps.some(st => st.tts);
      const runs = [];
      for (const step of steps) {
        let piece = null;
        const prev = runs[runs.length - 1];
        const valueWords = () => (step.type ? speakValue(step.value, step.type).replace(/francs CFA/g, 'CFA francs') : speakable(step.value));
        const ttsText = step.tts || (modelSentence && step.value ? valueWords() : null);
        if (ttsText) { // model pieces next to each other are sent as one request
          if (prev && prev.tts && !prev.audio) prev.tts += ` ${ttsText}`;
          else runs.push({ tts: ttsText });
          continue;
        }
        // Numbers and amounts are read in French (exact figures). Names stay with the national
        // voice so the sentence does not jump between voices ("e Jean-Paul Mbarga" in one go).
        const isName = step.value && (step.type === 'name' || step.type === 'user-value' || (!step.type && !/\d/.test(step.value)));
        if (step.value && nat.sameForValues && nat.voice) piece = { voice: nat.voice, text: step.type ? speakValue(step.value, step.type).replace(/francs CFA/g, 'CFA francs') : speakable(step.value) };
        else if (step.value && isName && nat.voice && nat.voice !== fr) piece = { voice: nat.voice, text: step.value };
        else if (step.value) piece = { voice: fr, text: step.type ? speakValue(step.value, step.type) : speakable(step.value) };
        else if (step.nat) piece = { voice: nat.voice, text: nat.adapt(step.nat), national: true };
        if (piece && prev && prev.voice === piece.voice && !prev.audio && !prev.tts) { prev.text += ` ${piece.text}`; prev.national = prev.national || piece.national; }
        else runs.push(piece || step);
      }
      // Long model text is cut at sentence ends so the first words play quickly: the first
      // sentence alone, then parts of about 160 characters.
      const parts = [];
      for (const r of runs) {
        if (!(r.tts && r.tts.length > 160)) { parts.push(r); continue; }
        const sentences = r.tts.match(/[^.!?]+[.!?]+["»”)]*\s*|[^.!?]+$/g) || [r.tts];
        let cur = '';
        let first = true;
        for (const piece of sentences) {
          cur += piece;
          if (first || cur.length >= 160) { parts.push({ tts: cur.trim() }); cur = ''; first = false; }
        }
        if (cur.trim()) parts.push({ tts: cur.trim() });
      }
      // The local model answers one request at a time: ask in reading order, one after the other,
      // so the part being played is never queued behind a later one, and the next part is made
      // while the current one plays. After Stop, the remaining parts are not asked for.
      let chain = Promise.resolve();
      const pending = parts.map(r => {
        if (!(r.tts && tts)) return null;
        const p = chain.then(() => (s.stopped ? null : tts(r.tts))).catch(() => null);
        chain = p;
        return p;
      });
      for (const [i, r] of parts.entries()) {
        if (s.stopped) break;
        if (r.audio) { report('human'); await playUrl(r.audio, s); }
        else if (r.tts && tts) {
          report('wait');
          const got = await pending[i];
          if (s.stopped) break;
          if (typeof got === 'string') {
            report('local');
            if (!(await playUrl(got, s)) && !s.stopped) { report(srcOf(nat.voice), 'error'); await say(nat.adapt(r.tts), nat.voice, s); }
          }
          else { report(srcOf(nat.voice), (got && got.fail) || 'offline'); await say(nat.adapt(r.tts), nat.voice, s); }
        } else if (r.text !== undefined) {
          if (r.national) report(srcOf(r.voice));
          await say(r.text, r.voice, s);
        }
      }
      // onStop({ spoke }): spoke = false means nothing could be heard (no voice on this device,
      // audio blocked): the button says so instead of failing silently.
      if (session === s) { session = null; if (onStop) onStop({ stopped: false, spoke: !!s.spoke }); }
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
    ['receiver', /\b(qui|who|benefici\w*|receive|collect|recoit|recevra|pesin|person|jaboowo|moye|nom|name|innde)\b/],
    ['steps', /\b(steps?|stages?|process|etapes?|how (?:does|do) (?:the )?(?:transfer|payment) work|what happens next)\b/],
    ['next', /\b(next|ensuite|apres|faire|fais|maintenant|now|do now|go do|continue[rz]?|bouton|button|click|cliquer|press|jokku|wad\w*|jooni)\b/],
    ['warning', /\b(danger|attention|warning|alerte?|risk|risque|safe|secur\w*|reentino|kisal|probleme?|problem|erreur|error|wahala)\b/],
    ['amount', /\b(combien|how much|montant|amount|payer|pay|moni|money|ceede|total|frais|fees|charges?|cost|cout|debit|yob\w*|no foti)\b/],
    ['page', /\b(page|what|quoi|wetin|wtin|happen\w*|passe|about|sujet|expliqu\w*|explain|hondum|ki be|ndoo|doo|hello ngol)\b/],
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
      const hasId = ids => units.some(u => u.result && ids.some(id => (u.result.ids || []).includes(id) || u.result.id === id));
      const valueAfter = i => {
        const u = units[i];
        if (/:\s*\S/.test(u.text) && u.result && u.result.status === 'ok') return u.text.split(/:\s*/).slice(1).join(': ');
        for (let k = i + 1; k < Math.min(units.length, i + 4); k++) {
          const next = units[k];
          // Stepper badges are protected values too. A nearby bare "4" is a step
          // number, never an amount or beneficiary value.
          if (next.result && next.result.value && /\p{L}/u.test(next.text)) return next.text;
        }
        return null;
      };
      const val = ids => { for (const id of ids) { const i = idx(id); if (i >= 0) { const v = valueAfter(i); if (v) return v; } } return null; };
      const numberNear = ids => {
        for (const id of ids) {
          const i = idx(id);
          if (i < 0) continue;
          for (let k = i; k < Math.min(units.length, i + 10); k++) {
            const u = units[k];
            const idsHere = u.result ? [...(u.result.ids || []), u.result.id || ''] : [];
            if (!u.result || !u.result.value || idsHere.some(x => /step/i.test(x))) continue;
            const candidate = u.text.trim();
            if (/^\d(?:[\d\s,.'’]*\d)?$/.test(candidate)) return candidate;
          }
        }
        return null;
      };
      // A money value has digits: the bare currency label next to an input ("FCFA") is not one.
      const currencyValue = u => u && u.result && u.result.value && /(?:FCFA|CFA|XAF|XOF)/i.test(u.text) && /\d/.test(u.text) ? u.text.trim() : null;
      // Financial labels and values are often separate, deeply nested DOM blocks. Search
      // nearby protected values instead of assuming the amount is one of the next three units.
      const moneyNear = ids => {
        for (const id of ids) {
          const i = idx(id);
          if (i < 0) continue;
          const direct = currencyValue(units[i]);
          if (direct) return direct;
          for (let k = i + 1; k < Math.min(units.length, i + 16); k++) {
            const v = currencyValue(units[k]);
            if (v) return v;
          }
        }
        return null;
      };
      const stepDefs = [
        ['step_pay', 'Pay'], ['step_costs', 'Costs'], ['step_beneficiary', 'Beneficiary'],
        ['step_summary', 'Summary'], ['step_confirmation', 'Confirmation'],
      ];
      const heading = units.find(u => /^H[1-3]$/.test(u.el.tagName) && !(u.result && u.result.value)
        && !/^(hello|bonjour)\b/i.test(u.text) && !u.el.closest('nav, aside, [role="navigation"]'));
      const headingText = heading ? heading.text.trim() : '';
      const pageText = units.map(u => u.text).join(' ');
      const activeStep = units.find(u => {
        const isStep = stepDefs.some(([id]) => u.result && ((u.result.ids || []).includes(id) || u.result.id === id));
        if (!isStep) return false;
        return !!u.el.closest('[aria-current="step"], [aria-current="page"], [aria-selected="true"], [data-state="active"], [data-active="true"], .active, .current, .is-active, .step-active');
      });
      const activeDef = activeStep && stepDefs.find(([id]) => (activeStep.result.ids || []).includes(id) || activeStep.result.id === id);
      let pageKind = 'account';
      if (hasId(['transfer_completed', 'transfer_sent_success', 'transfer_success']) || /transfer completed|transfer has been sent successfully|virement termin[eé]|transfert effectu[eé]/i.test(pageText)) pageKind = 'complete';
      else if (hasId(['transfer_summary']) || /^(transfer )?summary$|^r[eé]capitulatif( du virement)?$/i.test(headingText)) pageKind = 'summary';
      else if (hasId(['enter_recipient_info', 'new_beneficiary_warning']) || /enter the recipient.?s information|always check the number before submitting|saisissez les informations du destinataire/i.test(pageText) || /^beneficiary|^b[eé]n[eé]ficiaire$/i.test(headingText)) pageKind = 'beneficiary';
      else if (hasId(['transfer_fees', 'choose_type_amount']) || /choose the transfer type and amount|transfer fees|frais de virement/i.test(pageText) || /^(transfer )?(fees|costs)$|^frais( de virement)?$/i.test(headingText)) pageKind = 'costs';
      else if (activeDef) pageKind = ({ step_pay: 'account', step_costs: 'costs', step_beneficiary: 'beneficiary', step_summary: 'summary', step_confirmation: 'confirmation' })[activeDef[0]];
      else if (/^confirmation$/i.test(headingText)) pageKind = 'confirmation';
      const isButton = u => /^(BUTTON|A)$/.test(u.el.tagName) || u.el.getAttribute('role') === 'button' || (u.el.tagName === 'INPUT' && /submit|button/.test(u.el.type));
      const buttons = units.filter(u => isButton(u) && u.result && !u.result.value);
      const order = ['confirm_transfer', 'confirm', 'continue', 'perform_transfer', 'new_transfer'];
      const main = order.map(id => buttons.find(b => (b.result.ids || []).includes(id) || b.result.id === id)).find(Boolean) || buttons[buttons.length - 1];
      return {
        title: heading ? shownText(heading) : (document.title || '').split(/\s+[|·•–—-]\s+/)[0],
        total: moneyNear(['total_debited']) || val(['total_debited']),
        amount: moneyNear(['amount', 'amount_to_send']) || val(['amount', 'amount_to_send']),
        amountNumber: numberNear(['amount', 'amount_to_send']),
        fees: moneyNear(['fees', 'transfer_fees', 'transaction_fees']) || val(['fees', 'transfer_fees', 'transaction_fees']),
        receiver: (() => {
          const candidate = val(['beneficiary_name', 'beneficiary']);
          return candidate && /^[\p{Lu}][\p{L}'’.-]*(?:\s+[\p{Lu}][\p{L}'’.-]*){0,3}$/u.test(candidate.trim()) ? candidate.trim() : null;
        })(),
        balance: moneyNear(['available_balance', 'balance']) || val(['available_balance', 'balance']),
        warnings: units.filter(u => u.result && (u.result.kind === 'warning' || u.result.kind === 'error') && !u.result.value).map(shownText),
        next: main ? `«${shownText(main)}»` : null,
        pageKind,
        activeStep: activeDef ? activeDef[1] : null,
      };
    }

    // ---------------- built-in answers ----------------
    function answer(intent) {
      const f = facts();
      const out = [];
      const say = (id, fr, vars = {}) => out.push(fill(ui(id, fr), vars));
      const isLns = state.pack.code === 'lns';
      // The five steps in this language, from the page's own step labels (never an English list
      // inside a national-language answer).
      const stepsList = STEP_IDS.map(([id, en], k) => `${k + 1}) ${packText(id) || en}`).join(' · ');
      if (intent === 'page') {
        const pages = {
          account: ['ans_page_account', 'This is your account overview. It shows your available balance and recent transactions.'],
          costs: ['ans_page_costs', 'This is the costs step. Choose the transfer type and amount; check the fee and total before continuing.'],
          beneficiary: ['ans_page_beneficiary', 'This is the beneficiary step. Enter the recipient name and phone number, then check both before continuing.'],
          summary: ['ans_page_summary', 'This is the transfer summary. Check the amount, fees, recipient, and phone number before confirming.'],
          confirmation: ['ans_page_confirmation', 'This is the confirmation step. Review the transfer details, then confirm only if they are correct.'],
          complete: ['ans_page_complete', 'The transfer is complete. This page shows its amount, recipient, and status.'],
        };
        const [id, en] = pages[f.pageKind] || pages.account;
        if (isLns) out.push(en);
        else say(id, en);
        if (f.pageKind !== 'complete') out.push(isLns ? 'Steps: Pay, Costs, Beneficiary, Summary, Confirmation. Check each detail before confirming.' : `${stepsList}.`);
        const total = [f.total, f.amount].find(v => v && /(?:FCFA|CFA|XAF|XOF)/i.test(v));
        if (total) isLns ? out.push(`Total amount: ${total}.`) : say('ans_amount', 'Total amount: {total}.', { total });
        if (f.receiver) isLns ? out.push(`Recipient: ${f.receiver}.`) : say('ans_receiver', 'The money goes to {name}.', { name: f.receiver });
        if (f.pageKind === 'account' && f.balance) isLns ? out.push(`Available account balance: ${f.balance}.`) : say('ans_balance', 'Money available: {balance}.', { balance: f.balance });
      } else if (intent === 'amount') {
        const total = [f.total, f.amount].find(v => v && /(?:FCFA|CFA|XAF|XOF)/i.test(v) && /\d/.test(v));
        const fees = f.fees && /(?:FCFA|CFA|XAF|XOF)/i.test(f.fees) && /\d/.test(f.fees) ? f.fees : null;
        if (total) isLns ? out.push(`Total amount: ${total}.`) : say('ans_amount', 'Total amount: {total}.', { total });
        if (fees) isLns ? out.push(`Transfer fee: ${fees}.`) : say('ans_fees', 'Fees: {fees}.', { fees });
        if (!out.length) isLns ? out.push('No amount to pay is shown on this page.') : say('ans_no_amount', 'I do not see an amount to pay on this page.');
      } else if (intent === 'receiver') {
        if (f.receiver) isLns ? out.push(`Recipient: ${f.receiver}.`) : say('ans_receiver', 'The money goes to {name}.', { name: f.receiver });
        else isLns ? out.push('No beneficiary is shown on this page yet.') : say('ans_no_receiver', 'I do not see a beneficiary on this page yet.');
      } else if (intent === 'warning') {
        if (isLns) out.push('Before confirming, check the beneficiary name and phone number carefully.');
        else if (f.warnings.length) f.warnings.slice(0, 2).forEach(m => say('ans_warning', 'Warning: {message}', { message: m }));
        else say('ans_no_warning', 'No warning is shown on this page.');
      } else if (intent === 'next') {
        if (f.next) isLns ? out.push(`After checking the details, press ${f.next}.`) : say('ans_next', 'Next, press {button}.', { button: f.next });
        else isLns ? out.push('No next-step button is visible on this page.') : say('ans_no_button', 'I do not see a button to press.');
      } else if (intent === 'balance') {
        if (f.balance) isLns ? out.push(`Available account balance: ${f.balance}.`) : say('ans_balance', 'Available balance: {balance}.', { balance: f.balance });
        else isLns ? out.push('No available balance is shown on this page.') : say('ans_no_balance', 'I do not see an available balance on this page.');
      } else if (intent === 'steps') {
        const full = 'A transfer has five steps. Pay starts the transfer. Costs lets you choose the type and amount and check the fee. Beneficiary asks for the recipient name and phone number. Summary lets you review the details. Confirmation sends it only after you confirm.';
        // A speaker's full explanation when it exists; otherwise the steps by name, in this language.
        if (isLns) out.push(full);
        else if (packText('ans_steps')) say('ans_steps', full);
        else out.push(`${stepsList}.`);
      }
      return out.join(' ');
    }

    /** Kamtok replies use the same page facts as the built-in answers, with short natural wording. */
    function answerKamtok(intent) {
      if (state.pack.code !== 'wes') return null;
      const f = facts();
      // A bare step number can be mistaken for the transfer amount when a page
      // has several stages. Only report values that visibly carry the currency.
      const money = value => value && /(?:FCFA|CFA|XAF|F\s*CFA)/i.test(value) && /\d/.test(value) ? value : null;
      const isFree = value => /^[0\s.,]+(?:F\s*)?(?:FCFA|CFA|XAF)$/i.test(value.trim());
      const amount = money(f.amount) || (f.amountNumber ? `${f.amountNumber} FCFA` : null);
      const total = money(f.total);
      const fees = money(f.fees);
      const balance = money(f.balance);
      const out = [];
      if (intent === 'page') {
        const page = {
          account: 'Dis na your account page. E show the money wey dey your account and your recent transactions. To send the money, follow the five transfer steps: Pay, See charges, Person wey go receive am, Check all tindem, Confirm.',
          costs: 'You dey the step for see the charges. Choose the transfer type and amount here; check the charges and total before you continue. The full steps na Pay, See charges, Person wey go receive am, Check all tindem, Confirm.',
          beneficiary: 'You dey the step for the person wey go receive am. Put the receiver name and phone number, then check them well before you continue. The full steps na Pay, See charges, Person wey go receive am, Check all tindem, Confirm.',
          summary: 'You dey the step wey show all tindem wey you don enter, so you fit confirm am. Check the amount, charges, receiver name, and phone number before you confirm. The full steps na Pay, See charges, Person wey go receive am, Check all tindem, Confirm.',
          confirmation: 'You dey the Confirm step. Read the transfer details again and confirm only if everything correct.',
          complete: 'The transfer don complete. Dis page show the amount, who receive am, and the status.',
        };
        out.push(page[f.pageKind] || page.account);
        if (amount && f.pageKind !== 'costs') out.push(`You wan send ${amount}.`);
        if (fees && f.pageKind === 'costs') out.push(isFree(fees) ? 'The transfer charge na free (0 FCFA).' : `The transfer charge na ${fees}.`);
        if (total && f.pageKind === 'summary') out.push(`The total wey go comot your account na ${total}.`);
        if (f.receiver && ['beneficiary', 'summary', 'complete'].includes(f.pageKind)) out.push(`Na ${f.receiver} go receive the money.`);
      } else if (intent === 'steps') {
        out.push('Transfer get five steps: 1) Pay: start the transfer. 2) See charges: choose the type and amount, then check the charges. 3) Person wey go receive am: put and check the receiver name and number. 4) Check all tindem: look all wetin you don enter one more time. 5) Confirm: confirm only when all the details correct.');
      } else if (intent === 'amount') {
        if (total || amount) out.push(`All the money wey go comot for your account na ${total || amount}.`);
        if (fees) out.push(`The charges na ${fees}.`);
        if (!out.length && balance) out.push(`You never choose how much to send yet. The money wey you fit use na ${balance}.`);
        if (!out.length) out.push('I no see the amount for this page.');
      } else if (intent === 'receiver') {
        out.push(f.receiver ? `Na ${f.receiver} go receive the money.` : 'The person wey go receive the money never show for this page.');
      } else if (intent === 'warning') {
        out.push(f.warnings.length ? 'Before you confirm, check the receiver name and number well.' : 'I no see any warning for this page.');
      } else if (intent === 'next') {
        out.push(f.next ? `If you don check everything, press ${f.next}.` : 'I no see the next button for this page.');
      } else if (intent === 'balance') {
        out.push(balance ? `The money wey you fit use now na ${balance}.` : 'I no see your available balance for this page.');
      }
      return out.length ? out.join(' ') : null;
    }

    /** Answer text -> speech steps: words in the national voice, amounts/names read exactly. */
    function stepsOf(text) {
      const m = P.mask(text, { brands: state.brands || [] });
      const steps = [];
      let rest = m.masked;
      for (const t of m.tokens) {
        const [before, after] = rest.split(t.key);
        if (/\p{L}/u.test(before)) steps.push({ missing: true, text: before.trim() });
        if (t.type === 'money' && ['wes', 'lns'].includes(state.pack.code)) {
          // Keep the exact numeric value, but send it through the selected language voice.
          const rawNumber = (t.value.match(/\d[\d\s.,]*\d|\d/) || [''])[0];
          const number = root.LangwaSpeech ? root.LangwaSpeech.spokenNumber(rawNumber) : rawNumber.replace(/[\s.,]/g, '');
          steps.push({ missing: true, text: state.pack.code === 'lns' ? `${number} francs CFA` : `${number} CFA francs` });
        } else if (t.type === 'money' && (state.pack.africaTts || state.pack.mms)) {
          // Let the selected language's local speech model pronounce the amount, instead of
          // routing every non-Pidgin amount through the French number voice.
          steps.push({ missing: true, text: t.value });
        } else steps.push({ value: t.value, type: t.type });
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
      if (intent) {
        const grounded = answerKamtok(intent) || answer(intent);
        if (state.pack.code !== 'lns') return reply(grounded);
        const thinking = waitFor('think');
        let translated = '';
        try {
          const masked = P.mask(grounded, { brands: state.brands || [] });
          const result = await timed(send({ type: 'translateBatch', lang: 'lns', items: [{ masked: masked.masked }] }), 60000);
          const draft = result && !result.timeout && result.results && result.results[0];
          if (draft && draft.text) {
            const restored = P.unmask(draft.text, masked.tokens);
            if (restored.ok) translated = restored.text;
          }
        } catch { /* show the grounded fallback below */ }
        done(thinking);
        return translated
          ? reply(translated, { model: true })
          : reply(`English fallback (Lamnso draft unavailable): ${grounded}`);
      }
      // Free question: local open-source model, if set up.
      if ((state.settings.mt && state.settings.mt.mode === 'openai') || state.pack.code === 'lns') {
        const thinking = waitFor('think');
        const context = state.units.filter(u => u.result).slice(0, 80).map(u => (u.result.value ? u.text : `${shownText(u)} (${u.text})`));
        let res = null;
        try { res = await timed(send({ type: 'chat', lang: state.pack.code, question: q, context }), 60000); } catch { res = null; }
        done(thinking);
        if (res && res.timeout) { reply(ui('ans_model_timeout', 'Le modèle local met trop de temps. Voici ce que je peux dire sans lui :'), { chips: true }); return; }
        if (res && res.text && numbersAreFromPage(res.text)) {
          // Do not show unconstrained model prose as Kamtok: many local models only know
          // Nigerian Pidgin or produce literal English word order. Keep the grounded path.
          if (state.pack.code !== 'wes') return reply(res.text, { model: true });
        }
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

    // ---------------- waiting feedback ----------------
    const timed = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r({ timeout: true }), ms))]);
    /** A "working" bubble: dots + what is happening; after 8 s, why it takes time. */
    function waitFor(kind) {
      const m = push({ role: 'bot', text: '…', pending: true, kind, since: Date.now() });
      setBusy(true);
      setTimeout(() => { if (chat.includes(m)) render(); }, 8050);
      return m;
    }
    function done(m) {
      const i = chat.indexOf(m);
      if (i >= 0) chat.splice(i, 1);
      setBusy(false);
      render();
    }
    function setBusy(on) {
      if (!els) return;
      els.send.disabled = on;
      els.log.setAttribute('aria-busy', String(on));
      els.chips.querySelectorAll('button').forEach(b => { b.disabled = on; });
    }
    function waitText(m) {
      const slow = Date.now() - m.since > 8000;
      if (m.kind === 'asr') return slow ? ui('ui_transcribing_slow', 'Je transcris votre voix… (le modèle vocal démarre)') : ui('ui_transcribing', 'Je transcris votre voix…');
      return slow ? ui('ui_model_loading', 'Le modèle local démarre : la première réponse peut prendre une minute.') : ui('ui_thinking', 'Je réfléchis…');
    }

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
      r.onerror = e => {
        const why = e && e.error;
        if (why === 'no-speech') reply(ui('ans_no_speech', 'Je n’ai rien entendu. Touchez le micro et parlez, ou écrivez votre question.'));
        else if (why === 'not-allowed' || why === 'service-not-allowed') reply(ui('ans_mic_blocked', 'Le micro est bloqué. Autorisez-le dans la barre d’adresse du navigateur, ou écrivez votre question.'));
        else if (why === 'network') reply(ui('ans_speech_network', 'La reconnaissance vocale a besoin d’internet. Écrivez votre question ou réessayez.'));
        else if (why && why !== 'aborted') reply(ui('ans_type_instead', 'Écrivez votre question ou touchez une question ci-dessous.'));
      };
      r.onend = () => { rec = null; setMic(false); };
      r.start();
    }

    async function listenLocal() {
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { return reply(ui('ans_mic_blocked', 'Le micro est bloqué. Autorisez-le dans la barre d’adresse du navigateur, ou écrivez votre question.')); }
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
        const thinking = waitFor('asr');
        if (els) els.mic.classList.add('busy');
        let res = null;
        try {
          const wav = await toWav16k(new Blob(chunks, { type: mr.mimeType }));
          res = await timed(send({ type: 'asr', audio: wav, hint: state.pack.code }), 45000);
        } catch { res = null; }
        if (els) els.mic.classList.remove('busy');
        done(thinking);
        const heardNothing = res && !res.timeout && typeof res.text === 'string' && !res.text.trim();
        if (!res || res.timeout || !res.text) { reply(heardNothing ? ui('ans_no_speech', 'Je n’ai rien entendu. Touchez le micro et parlez, ou écrivez votre question.') : ui('ans_asr_down', 'Je n’ai pas pu transcrire votre voix (serveur vocal local éteint ?). Écrivez votre question.')); return; }
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

    function setMic(on) {
      if (!els) return;
      const label = on ? ui('ui_listening_stop', 'J’écoute… touchez pour arrêter') : ui('ui_mic', 'Parler');
      els.mic.classList.toggle('on', on);
      els.mic.setAttribute('aria-pressed', String(on));
      els.mic.setAttribute('aria-label', label);
      els.mic.title = label;
      els.input.placeholder = on ? ui('ui_listening_stop', 'J’écoute… touchez pour arrêter') : ui('ui_ask_placeholder', 'Posez votre question…');
    }

    // ---------------- view ----------------
    /** This language's own translation of a phrase (page labels and interface), or ''. */
    const packText = id => { const e = (state.pack.entries || []).find(x => x.id === id); return (e && e.t) || ''; };
    const STEP_IDS = [['step_pay', 'Pay'], ['step_costs', 'Costs'], ['step_beneficiary', 'Beneficiary'], ['step_summary', 'Summary'], ['step_confirmation', 'Confirmation']];
    const QUESTIONS = [
      ['page', 'q_page', 'C’est quoi cette page ?'],
      ['steps', 'q_steps', state.pack.code === 'wes' ? 'Wetin be the transfer steps?' : (/^en/i.test(navigator.language || '') ? 'What are the transfer steps?' : 'Quelles sont les étapes du virement ?')],
      ['amount', 'q_amount', 'Combien je vais payer ?'],
      ['receiver', 'q_receiver', 'Qui reçoit l’argent ?'],
      ['warning', 'q_warning', 'Y a-t-il un danger ?'],
      ['next', 'q_next', 'Je fais quoi maintenant ?'],
    ];

    function mount() {
      const log = h('div', { class: 'log', 'aria-live': 'polite' });
      // One quiet line that never pushes the conversation away: details on tap, × hides it for good.
      let pidginCoverage = null;
      if (state.pack.code === 'wes' && (!state.settings.mt || state.settings.mt.mode === 'none') && !state.coverageHidden) {
        const close = h('button', { type: 'button', class: 'cn-x', 'aria-label': ui('ui_close', 'Fermer'), title: ui('ui_close', 'Fermer') }, icon('x'));
        pidginCoverage = h('details', { class: 'coverage-note' },
          h('summary', {}, icon('info'), h('span', {}, 'Limited Pidgin translation'), h('span', { class: 'cn-more' }, 'Details'), close),
          h('p', {}, 'No general Pidgin translation model is connected, and machine translation is off. Page translation relies on phrase matches, so unfamiliar text may stay in English or appear as not translated.'));
        close.addEventListener('click', e => {
          e.preventDefault();
          state.coverageHidden = true;
          pidginCoverage.remove();
          try { api.storage.local.set({ coverageHidden: true }); } catch { /* not critical */ }
        });
        api.storage.local.get('coverageHidden').then(r => { if (r && r.coverageHidden) { state.coverageHidden = true; pidginCoverage.remove(); } }).catch(() => {});
      }
      // In a language that already has most questions translated, untranslated ones are left out
      // (no English chip among Fulfulde ones); a language with few translations shows them all.
      const translatedQs = QUESTIONS.filter(([, id]) => packText(id));
      const shownQs = translatedQs.length >= 3 && state.pack.code !== 'wes' ? translatedQs : QUESTIONS;
      const chips = h('div', { class: 'qchips' }, shownQs.map(([intent, id, fr]) => h('button', { type: 'button', class: 'qchip', onclick: () => ask(ui(id, fr), intent) }, ui(id, fr))));
      const input = h('input', { type: 'text', class: 'askin', placeholder: ui('ui_ask_placeholder', 'Posez votre question…'), 'aria-label': ui('ui_ask_placeholder', 'Posez votre question…'), enterkeyhint: 'send' });
      const mic = h('button', { type: 'button', class: 'mic', title: ui('ui_mic', 'Parler'), 'aria-label': ui('ui_mic', 'Parler'), onclick: listen }, icon('mic'));
      const sendBtn = h('button', { type: 'submit', class: 'sendq', 'aria-label': ui('ui_send', 'Envoyer') }, icon('send'));
      const form = h('form', { class: 'askrow' }, mic, input, sendBtn);
      form.addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; ask(v); });
      input.addEventListener('keydown', e => e.stopPropagation()); // typing never triggers page shortcuts
      const view = h('div', { class: 'chat' }, pidginCoverage, log, chips, form);
      els = { view, log, chips, input, mic, send: sendBtn };
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
          h('div', { class: 'mrow' }, h('div', { class: 'mtext' }, m.pending
            ? h('span', { class: 'mwait', role: 'status' }, h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('span', { class: 'mwt' }, waitText(m)))
            : m.text),
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
  const TOTAL = Math.max(1, ((D.source && D.source.entries) || []).length);
  const langs = () => Object.fromEntries(Object.entries(D.langs).map(([c, l]) => {
    const n = count(c);
    return [c, { ...l, count: n, total: TOTAL, pct: Math.min(100, Math.round((100 * n) / TOTAL)) }];
  }));

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

  // Extension APIs, or the standalone runtime when running as a userscript on phones. Only an
  // object with working runtime and storage counts: a page element with id="browser" shows up as
  // window.browser, and while the extension is being reloaded or updated Chrome hands a starting
  // script a cut-down chrome object without storage. Then this copy stays silent; the next page
  // load gets a working one.
  const api = [globalThis.LangwaRuntime, globalThis.browser, globalThis.chrome]
    .find(a => a && a.runtime && a.storage && a.storage.local && a.storage.onChanged);
  if (!api) return;
  window.__langwa = true;
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
  let panelVoice; // live voice line in the panel header (browser voice / natural voice 42 % / ready)
  let voiceFix;   // the choice shown when the natural voice is not on this computer
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
  /** replaceChildren without empty slots: the browser would write a null child as the text "null". */
  const fill = (el, ...kids) => el.replaceChildren(...kids.flat().filter(k => k != null && k !== false));

  /*
   * Theme: warm ebony and ivory surfaces, kente gold accent, forest green for
   * validated/listen, terracotta for errors, indigo for information. A thin kente-stripe band
   * is the signature. All colours meet WCAG AA contrast on their surfaces.
   */
  const CSS = `
  :host { all: initial; display: block; position: fixed; inset: 0; z-index: 2147483644; width: 100vw; height: 100vh; height: 100dvh; pointer-events: none; }
  * { box-sizing: border-box; margin: 0; font-family: "Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, Roboto, "Noto Sans", sans-serif; }
  button { cursor: pointer; font: inherit; color: inherit; }
  :focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }
  svg.i { width: 1em; height: 1em; flex: none; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; vertical-align: -.15em; }
  svg.i.fill { fill: currentColor; stroke: none; }

  .layer {
    position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;
    --ebony: #1d1712; --ebony-2: #2a221b; --ebony-3: #3d3229; --ivory: #fbf6ee; --sand: #d9c9b4;
    --gold: #e3a21a; --gold-soft: #f6dfa6; --forest: #1e7a4c; --forest-2: #2f9e66; --terracotta: #c2502e; --indigo: #3d4a8a; --indigo-2: #8fa0e6;
    --card: #fffcf7; --card-fg: #241d16; --card-muted: #76675a; --line: #ebdfcd; --soft: #f6eee2;
    --kente: repeating-linear-gradient(90deg, #e3a21a 0 18px, #1e7a4c 18px 24px, #c2502e 24px 36px, #1d1712 36px 40px, #e3a21a 40px 46px, #3d4a8a 46px 52px);
  }
  @media (prefers-color-scheme: dark) {
    .layer { --card: #1f1913; --card-fg: #f6efe4; --card-muted: #b7a690; --line: #3a3027; --soft: #2a221b; }
  }

  /* ---------- hover card ---------- */
  .tip { position: fixed; z-index: 2147483647; width: max-content; max-width: min(440px, calc(100vw - 16px)); pointer-events: auto;
    min-width: min(290px, calc(100vw - 16px)); box-sizing: border-box;
    background: var(--ebony); color: var(--ivory); border-radius: 18px; padding: 16px 18px 14px;
    box-shadow: 0 24px 60px rgba(20,12,4,.42), 0 2px 8px rgba(20,12,4,.25), 0 0 0 1px rgba(255,240,220,.08);
    font-size: 15px; line-height: 1.4; visibility: hidden; opacity: 0; transform: translateY(4px);
    transition: opacity .14s ease, transform .14s ease, visibility 0s .14s; }
  .tip.show { visibility: visible; opacity: 1; transform: none; transition: opacity .14s ease, transform .14s ease; }
  .tip.passthru { pointer-events: none; }
  .arrow { position: absolute; width: 14px; height: 14px; background: var(--ebony); transform: rotate(45deg); top: -6px; border-radius: 3px; }
  .tip.above .arrow { top: auto; bottom: -6px; }
  .block + .block { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--ebony-3); }
  .tr .i.kind { margin-right: 7px; }
  .tr .i.err { color: #ec8a6c; } .tr .i.warn { color: var(--gold); } .tr .i.okk { color: #6fd29d; }
  .tr.missing { font-size: 15px; font-weight: 600; color: var(--sand); }
  .row { display: flex; align-items: flex-start; gap: 14px; }
  .tr { flex: 1; min-width: 0; font-size: 19px; line-height: 1.3; font-weight: 700; letter-spacing: -.01em; overflow-wrap: break-word; padding-top: 6px; }
  .tr .i { color: var(--sand); margin-right: 6px; }
  .explain { display: flex; gap: 8px; margin-top: 10px; font-size: 14px; color: #efe3d1; }
  .explain .i { color: var(--gold); margin-top: 2px; }
  .orig { margin-top: 4px; font-size: 13.5px; color: var(--sand); opacity: .82; overflow-wrap: break-word; }
  .orig b { font-size: 9.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; margin-right: 8px; opacity: .6; }
  /* Footer: voice, protected values and validation status as one row of matching chips. */
  .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 12px; padding-top: 11px;
    border-top: 1px solid color-mix(in srgb, currentColor 10%, transparent); }
  .meta:empty { display: none; }
  .chip { display: inline-flex; align-items: center; gap: 5px; height: 24px; box-sizing: border-box; font: 700 12px "Cascadia Mono", ui-monospace, Consolas, monospace;
    background: var(--gold-soft); color: #3b2604; padding: 0 8px; border-radius: 7px; }
  .chip .i { font-size: 12px; }
  .pill { display: inline-flex; align-items: center; gap: 5px; height: 24px; box-sizing: border-box; font-size: 11.5px; font-weight: 650; padding: 0 10px 0 8px; border-radius: 999px; white-space: nowrap; }
  .pill.ok { background: rgba(47,158,102,.18); color: #7fd9a8; } .pill.mt { background: rgba(227,162,26,.18); color: #f3c460; }
  .pill.gist { background: rgba(143,160,230,.18); color: #b9c5f3; } .pill.block { background: rgba(194,80,46,.22); color: #f2a58d; }
  .pill.none { background: rgba(217,201,180,.14); color: var(--sand); }
  .skeleton { height: 18px; width: 220px; border-radius: 6px; background: linear-gradient(90deg, var(--ebony-2), var(--ebony-3), var(--ebony-2)); background-size: 200% 100%; animation: shimmer 1.1s linear infinite; }
  @keyframes shimmer { to { background-position: -200% 0; } }
  .spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }

  /* listen button */
  .say.wide { width: auto; height: 38px; padding: 0 15px 0 12px; display: inline-flex; gap: 7px; align-items: center; font-size: 17px; }
  .say .lbl { font-size: 13.5px; font-weight: 700; white-space: nowrap; }
  .bars { display: inline-flex; align-items: flex-end; gap: 2px; height: 16px; }
  .bars i { width: 3px; height: 6px; border-radius: 2px; background: currentColor; animation: eq .8s ease-in-out infinite; }
  .bars i:nth-child(2) { animation-delay: .15s; } .bars i:nth-child(3) { animation-delay: .3s; }
  @keyframes eq { 50% { height: 16px; } }
  .voice { display: flex; align-items: center; gap: 6px; margin-top: 6px; font-size: 12px; color: var(--sand); opacity: .85; }
  /* Voice chip: who is speaking, live (local model, browser voice, human recording). */
  .vchip { --c: var(--sand); display: inline-flex; align-items: center; gap: 6px; max-width: 100%; height: 24px; box-sizing: border-box; padding: 0 10px 0 8px;
    border-radius: 999px; font-size: 11.5px; font-weight: 650; line-height: 1; color: var(--c);
    background: color-mix(in srgb, var(--c) 13%, transparent); border: 1px solid color-mix(in srgb, var(--c) 30%, transparent);
    transition: color .2s ease, background .2s ease, border-color .2s ease; }
  .vchip .i { font-size: 13px; flex: none; }
  .vchip .vt { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .vchip .why { font-weight: 500; opacity: .8; }
  .vchip .dot { position: static; width: 7px; height: 7px; border: 0; box-shadow: none; border-radius: 50%; background: currentColor; flex: none; display: none; }
  .vchip.live .dot, .vchip.warm .dot { display: block; animation: pulse 1.1s ease-in-out infinite; }
  .vchip.warm .dot { color: var(--gold); }
  .pvoice { display: flex; align-items: center; gap: 6px; margin-top: 3px; font-size: 12px; font-weight: 600; color: var(--indigo-2); min-width: 0; }
  .pvoice svg { width: 13px; height: 13px; }
  .pvoice .vt { display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .pvoice .vt::first-letter { text-transform: uppercase; }
  .pvoice[data-s="ready"] { color: #7fd9a8; }
  .pvoice[data-s="notready"] { color: #f3c460; }
  .pvoice[data-s="online"] { color: #8fd3e6; }
  .vfix { margin: 0 14px 10px; padding: 12px; border-radius: 16px; background: var(--ebony-2); box-shadow: inset 0 0 0 1px var(--ebony-3); color: var(--ivory); display: grid; gap: 8px; animation: drop .2s ease; }
  .vfix[hidden] { display: none; }
  .vf-head { display: flex; align-items: center; justify-content: space-between; font-size: 14px; }
  .vf-x { border: 0; background: none; color: var(--sand); width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; }
  .vf-x:hover { background: var(--ebony-3); color: #fff; }
  .vf-opt { display: flex; align-items: flex-start; gap: 10px; width: 100%; text-align: left; border: 0; border-radius: 12px; padding: 10px 12px; background: var(--ebony-3); color: var(--ivory); cursor: pointer; }
  .vf-opt .i { flex: none; font-size: 18px; margin-top: 2px; color: var(--gold); }
  .vf-opt b { display: block; font-size: 14px; } .vf-opt small { display: block; font-size: 12.5px; color: var(--sand); margin-top: 2px; }
  .vf-opt.primary { background: var(--forest); } .vf-opt.primary .i { color: #fff; } .vf-opt.primary small { color: #d8f2e3; }
  .vf-opt:hover { filter: brightness(1.08); }
  .vf-note { margin: 0; font-size: 12.5px; color: var(--sand); }
  .pv-setup { flex: none; border: 0; background: rgba(243,196,96,.16); color: #f3c460; font: 700 11.5px inherit; font-family: inherit; padding: 2px 8px; border-radius: 99px; cursor: pointer; }
  .pv-setup:hover { background: rgba(243,196,96,.3); }
  .pvoice[data-s="installing"], .pvoice[data-s="loading"] { color: var(--gold); }
  .vprog { flex: none; width: 48px; height: 5px; border-radius: 99px; overflow: hidden; background: color-mix(in srgb, currentColor 22%, transparent); }
  .vprog i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #7fe0ad, var(--gold)); transition: width 3s linear; }
  .vchip[data-src="local"], .vchip[data-src="wait"] { --c: #7fe0ad; }
  .vchip[data-src="browser"] { --c: var(--indigo-2); }
  .vchip[data-src="online"] { --c: #8fd3e6; }
  .vchip[data-src="human"] { --c: var(--gold); }
  .vchip[data-src="wait"] .i { animation: spin 1s linear infinite; }
  .item .vchip { --c: var(--card-muted); }
  .item .vchip[data-src="local"], .item .vchip[data-src="wait"] { --c: color-mix(in srgb, var(--forest) 75%, var(--card-fg)); }
  .item .vchip[data-src="browser"] { --c: color-mix(in srgb, var(--indigo) 70%, var(--card-fg)); }
  .item .vchip[data-src="human"] { --c: color-mix(in srgb, #b07a0a 80%, var(--card-fg)); }
  .voice .i { font-size: 13px; }
  .item .voice { color: var(--card-muted); }
  .say { flex: none; width: 42px; height: 42px; border-radius: 999px; border: 0; display: grid; grid-auto-flow: column; gap: 4px; place-items: center; place-content: center; overflow: hidden; font-size: 20px;
    background: var(--forest); color: #fff; box-shadow: 0 4px 14px rgba(30,122,76,.45); transition: transform .1s ease, background .15s ease; }
  .say:hover { transform: scale(1.06); background: var(--forest-2); }
  .say:active { transform: scale(.95); }
  /* Every control answers the touch: a quick press, a hover lift, a busy cursor when working. */
  .tab, .qchip, .mic, .sendq, .icon-btn, .lang-btn, .maction, .cyes, .cno { transition: transform .1s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease, opacity .15s ease; }
  .tab:active, .qchip:active, .mic:active, .sendq:active, .icon-btn:active, .lang-btn:active, .maction:active, .cyes:active, .cno:active, .fab:active { transform: scale(.95); }
  .qchip:hover { border-color: var(--gold); }
  .mic:hover, .sendq:hover { box-shadow: 0 4px 12px rgba(20,12,4,.18); }
  .icon-btn:hover { border-color: var(--gold); }
  .sendq:disabled, .qchip:disabled { opacity: .45; cursor: progress; transform: none; }
  [aria-busy="true"] { cursor: progress; }
  .mic.busy { background: var(--ebony-3); color: var(--ivory); animation: none; cursor: progress; }
  .mwait { display: inline-flex; align-items: center; gap: 10px; }
  .mwt { font-size: 13px; color: var(--card-muted); }
  .mhint { margin-top: 6px; font-size: 12px; color: var(--card-muted); display: flex; align-items: center; gap: 6px; }
  .mhint .i { font-size: 13px; }
  .say.on { background: var(--terracotta); animation: ring 1.2s ease-out infinite; }
  /* preparing: calm, no pulsing ring yet (the ring means "sound is playing") */
  .say.on[data-phase="prep"], .say.on[data-phase="slow"] { background: color-mix(in srgb, var(--forest) 72%, var(--ebony)); animation: none; cursor: progress; }
  .say.on[data-phase="slow"] .lbl { opacity: .9; }
  .say.fail { background: var(--terracotta); animation: shake .32s ease; }
  @keyframes shake { 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
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
  .tab { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 42px; padding: 9px 10px; border: 0; border-radius: 12px; background: transparent; color: var(--card-muted); font-weight: 700; font-size: 14px; }
  .tab .i { font-size: 17px; }
  .tab.on { background: var(--ebony); color: var(--ivory); } .tab.on .i { color: var(--gold); }
  .tcount { display: none; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 99px; background: var(--terracotta); color: #fff; font-size: 11.5px; font-weight: 800; place-items: center; }
  .tcount.show { display: inline-grid; }

  /* ---------- assistant chat ---------- */
  .chat { display: flex; flex-direction: column; min-height: 0; flex: 1; }
  .chat[hidden], .list[hidden] { display: none; }
  .log { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 14px 6px; display: flex; flex-direction: column; gap: 10px; overscroll-behavior: contain; }
  .msg { max-width: 86%; padding: 10px 13px; border-radius: 16px; font-size: 15px; line-height: 1.45; overflow-wrap: anywhere; }
  .msg.me { align-self: flex-end; background: var(--ebony); color: var(--ivory); border-bottom-right-radius: 5px; }
  .msg.bot { align-self: flex-start; background: var(--soft); color: var(--card-fg); border: 1px solid var(--line); border-bottom-left-radius: 5px; }
  .mrow { display: flex; gap: 10px; align-items: flex-start; }
  .mtext { flex: 1; }
  .msg .say { width: 32px; height: 32px; font-size: 15px; box-shadow: none; }
  .mnote { margin-top: 6px; font-size: 11.5px; color: var(--card-muted); }
  .coverage-note { flex: none; margin: 8px 14px 0; border: 1px solid var(--line); border-radius: 10px; background: var(--soft); color: var(--card-muted); font-size: 12px; line-height: 1.4; }
  .coverage-note summary { display: flex; align-items: center; gap: 7px; padding: 5px 6px 5px 10px; cursor: pointer; list-style: none; font-weight: 600; }
  .coverage-note summary::-webkit-details-marker { display: none; }
  .coverage-note summary .i { flex: none; font-size: 13px; opacity: .8; }
  .coverage-note .cn-more { margin-left: auto; font-weight: 500; text-decoration: underline; text-underline-offset: 2px; opacity: .8; }
  .coverage-note[open] .cn-more { display: none; }
  .coverage-note[open] summary > span:nth-of-type(1) { flex: 1; }
  .coverage-note .cn-x { flex: none; display: grid; place-items: center; width: 24px; height: 24px; border: 0; border-radius: 6px; background: transparent; color: inherit; font-size: 13px; }
  .coverage-note .cn-x:hover { background: color-mix(in srgb, currentColor 10%, transparent); }
  .coverage-note p { margin: 0; padding: 0 12px 9px 30px; }
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
  .fab { position: fixed; right: 18px; bottom: 18px; z-index: 2147483646; display: flex; align-items: center; gap: 10px; pointer-events: auto;
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
  .panel { position: fixed; right: 18px; bottom: 82px; z-index: 2147483646; width: min(420px, calc(100vw - 36px)); max-height: min(72vh, 680px); max-height: min(72dvh, 680px);
    background: var(--card); color: var(--card-fg); border-radius: 20px; box-shadow: 0 24px 60px rgba(20,12,4,.32), 0 0 0 1px var(--line);
    display: flex; flex-direction: column; overflow: hidden; visibility: hidden; opacity: 0; transform: translateY(10px) scale(.98); transform-origin: bottom right; pointer-events: auto;
    transition: opacity .16s ease, transform .16s ease, visibility 0s .16s; }
  .panel.show { visibility: visible; opacity: 1; transform: none; transition: opacity .16s ease, transform .16s ease; }
  .panel { height: min(72vh, 680px); height: min(72dvh, 680px); }
  .band { height: 6px; background: var(--kente); flex: none; }
  /* Drag to move: the panel header and the floating button (they move together). */
  .ph { cursor: grab; touch-action: none; user-select: none; }
  .ph button, .ph select { cursor: pointer; }
  .fab { touch-action: none; }
  .layer.dragging .ph, .layer.dragging .fab { cursor: grabbing; }
  .layer.dragging .panel, .layer.dragging .fab { transition: none; }
  .layer.dragging .fab { transform: scale(1.03); box-shadow: 0 20px 40px rgba(20,12,4,.45), 0 0 0 2px var(--gold); }
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
  .toasts { position: fixed; left: 50%; transform: translateX(-50%); top: 16px; z-index: 2147483647; display: grid; gap: 10px; width: min(540px, calc(100vw - 24px)); pointer-events: auto; }
  .toast { position: relative; overflow: hidden; max-height: min(200px, 32dvh); background: var(--ebony); color: var(--ivory); border-radius: 16px; padding: 13px 14px 12px;
    box-shadow: 0 20px 50px rgba(20,12,4,.45); animation: drop .22s cubic-bezier(.2,.9,.3,1.2); }
  .toast::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 5px; background: var(--kente); }
  .toast .toast-head { display: flex; align-items: center; gap: 8px; padding-right: 42px; font-size: 14px; }
  .toast .toast-head strong { overflow-wrap: anywhere; }
  .toast .toast-copy { margin-top: 7px; max-height: 4.4em; overflow: auto; font-size: 14px; line-height: 1.4; overflow-wrap: anywhere; }
  .toast .toast-state { margin-top: 7px; color: var(--sand); font-size: 11.5px; line-height: 1.35; }
  .toast .toast-open { margin-top: 7px; min-height: 36px; padding: 6px 10px; border: 1px solid var(--ebony-3); border-radius: 9px; background: var(--ebony-2); color: var(--ivory); font-size: 12px; font-weight: 700; }
  .toast .x { position: absolute; top: 8px; right: 8px; width: 40px; height: 40px; border: 0; border-radius: 8px; background: transparent; color: var(--sand); font-size: 17px; display: grid; place-items: center; }
  .toast .x:hover { background: var(--ebony-3); color: #fff; }
  .toast .bar { position: absolute; left: 0; bottom: 0; height: 4px; background: var(--indigo-2); animation: shrink 10s linear forwards; }
  .toast.k-error .bar { background: var(--terracotta); } .toast.k-warning .bar { background: var(--gold); } .toast.k-success .bar { background: var(--forest-2); }
  .toast:hover .bar { animation-play-state: paused; }
  @keyframes drop { from { opacity: 0; transform: translateY(-12px) scale(.98); } }
  @keyframes shrink { from { width: 100%; } to { width: 0; } }

  /* ---------- page highlight, subtitles, first-run hint ---------- */
  .hl { display: none !important; }
  .subs { position: fixed; inset: 0; pointer-events: none; z-index: 2147483644; }
  .sub { position: fixed; padding: 0 2px; border-radius: 4px; box-sizing: border-box; overflow-wrap: normal; word-break: normal; hyphens: none;
    text-decoration: underline dotted rgba(227,162,26,.75); text-decoration-thickness: 1.5px; text-underline-offset: 3px; }

  .hint { position: fixed; right: 18px; bottom: 86px; z-index: 2147483647; width: min(330px, calc(100vw - 36px)); background: var(--ebony); color: var(--ivory); pointer-events: auto;
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
  .chooser { position: fixed; right: 18px; bottom: 18px; z-index: 2147483647; width: min(400px, calc(100vw - 24px)); max-height: calc(100vh - 36px); overflow: auto; pointer-events: auto;
    background: var(--ebony); color: var(--ivory); border-radius: 20px; padding: 24px 16px 12px; box-shadow: 0 24px 60px rgba(20,12,4,.45); animation: drop .3s ease; }
  .chooser::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 6px; border-radius: 20px 20px 0 0; background: var(--kente); }
  .chooser[hidden], .fab[hidden] { display: none; }
  .chooser .head { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; }
  .chooser .logo { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; background: var(--gold); color: var(--ebony); font-size: 22px; flex: none; }
  .chooser h3 { font-size: 18px; font-weight: 800; }
  .chooser p { font-size: 13px; color: var(--sand); margin-top: 2px; }
  .langs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .lang-btn { position: relative; display: grid; min-width: 0; gap: 4px; text-align: left; padding: 12px 12px 11px; border-radius: 14px; border: 1px solid var(--ebony-3); background: var(--ebony-2); transition: border-color .12s ease, transform .1s ease; }
  .lang-btn:hover { border-color: var(--gold); transform: translateY(-1px); }
  .lang-btn b { min-width: 0; font-size: 16px; font-weight: 800; overflow-wrap: anywhere; }
  .lang-btn small { min-width: 0; font-size: 11.5px; color: var(--sand); line-height: 1.35; overflow-wrap: anywhere; }
  .lang-btn { justify-items: start; align-content: start; }
  .lang-btn .soon { position: static; justify-self: start; max-width: 100%; font-size: 10px; font-weight: 800; letter-spacing: .035em; text-transform: uppercase; color: var(--gold); line-height: 1.35; overflow-wrap: anywhere; }
  /* guided tour: dimmed page, a ring around the control, a card beside it */
  .tour { position: fixed; inset: 0; z-index: 2147483646; pointer-events: auto; }
  .tip.intour { z-index: 2147483647; }
  .pf-guide { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; border: 0; background: none; color: inherit; font: 600 12.5px inherit; font-family: inherit; padding: 4px 8px; border-radius: 8px; }
  .pf-guide:hover { background: var(--soft); color: var(--card-fg); }
  .pf-guide .i { font-size: 14px; }
  .tspot { position: fixed; border-radius: 14px; box-shadow: 0 0 0 200vmax rgba(15,10,6,.62), 0 0 0 3px var(--gold), 0 0 24px 6px rgba(227,162,26,.45);
    transition: left .32s cubic-bezier(.2,.8,.2,1), top .32s cubic-bezier(.2,.8,.2,1), width .32s cubic-bezier(.2,.8,.2,1), height .32s cubic-bezier(.2,.8,.2,1);
    pointer-events: none; animation: tglow 2.2s ease-in-out infinite; }
  @keyframes tglow { 50% { box-shadow: 0 0 0 200vmax rgba(15,10,6,.62), 0 0 0 3px var(--gold), 0 0 36px 12px rgba(227,162,26,.62); } }
  .tcontent.fwd { animation: tinR .3s cubic-bezier(.2,.8,.2,1); } .tcontent.bwd { animation: tinL .3s cubic-bezier(.2,.8,.2,1); }
  @keyframes tinR { from { opacity: 0; transform: translateX(14px); } } @keyframes tinL { from { opacity: 0; transform: translateX(-14px); } }
  .tdone { width: 44px; height: 44px; border-radius: 99px; display: grid; place-items: center; margin-bottom: 10px; background: var(--forest-2); color: #fff; font-size: 22px; animation: tpop .45s cubic-bezier(.2,1.4,.4,1); }
  .tdone[hidden] { display: none; }
  @keyframes tpop { from { opacity: 0; transform: scale(.4); } 70% { transform: scale(1.12); } }
  .tour.nospot { background: rgba(15,10,6,.62); } .tour.nospot .tspot { display: none; }
  .tcard { position: fixed; width: min(360px, calc(100vw - 24px)); background: var(--ebony); color: var(--ivory); border-radius: 18px; padding: 16px 18px 14px;
    box-shadow: 0 24px 60px rgba(0,0,0,.45), 0 0 0 1px rgba(255,240,220,.1); transition: left .28s ease, top .28s ease; animation: drop .25s ease; }
  .tcard::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 5px; border-radius: 18px 18px 0 0; background: var(--kente); }
  .thead { display: flex; align-items: center; gap: 10px; margin: 4px 0 10px; }
  .tstep { font-size: 12px; font-weight: 800; color: var(--gold); font-variant-numeric: tabular-nums; }
  .tdots { display: flex; gap: 4px; }
  .tdots i { width: 6px; height: 6px; border-radius: 99px; background: var(--ebony-3); transition: background .25s ease, width .25s ease; }
  .tdots i.on { background: color-mix(in srgb, var(--gold) 55%, var(--ebony-3)); }
  .tdots i.cur { width: 18px; background: var(--gold); }
  .tskip { margin-left: auto; border: 0; background: none; color: var(--sand); font-size: 13px; padding: 4px 6px; border-radius: 8px; text-decoration: underline; text-underline-offset: 3px; }
  .tskip:hover { color: #fff; background: var(--ebony-2); }
  .tcard h4 { font-size: 18px; font-weight: 800; line-height: 1.3; margin: 0 0 6px; }
  .tcard p { font-size: 14.5px; line-height: 1.5; color: #efe3d1; margin: 0; }
  .tbtns { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  .tback, .tnext { border: 0; border-radius: 12px; padding: 10px 16px; font-size: 14.5px; font-weight: 700; transition: transform .1s ease, filter .15s ease, background .15s ease; }
  .tback:active, .tnext:active, .tskip:active { transform: scale(.95); }
  .tback { background: var(--ebony-2); color: var(--ivory); box-shadow: inset 0 0 0 1px var(--ebony-3); }
  .tnext { background: var(--gold); color: var(--ebony); min-width: 112px; }
  .tback:hover { background: var(--ebony-3); } .tnext:hover { filter: brightness(1.06); }
  @media (max-width: 640px) {
    .tcard { left: 0 !important; right: 0; bottom: 0; top: auto !important; width: 100vw; border-radius: 22px 22px 0 0; padding: 18px 18px max(16px, env(safe-area-inset-bottom)); }
    .tcard::before { border-radius: 22px 22px 0 0; }
    .tcard.top { top: 0 !important; bottom: auto; border-radius: 0 0 22px 22px; padding-top: max(18px, env(safe-area-inset-top)); }
    .tcard.top::before { top: auto; bottom: 0; border-radius: 0 0 22px 22px; }
    .tbtns .tnext { flex: 1; }
  }
  .lsearch-wrap { display: flex; align-items: center; gap: 9px; margin-bottom: 12px; padding: 0 12px; height: 42px; border-radius: 12px;
    border: 1px solid var(--ebony-3); background: var(--ebony-2); color: var(--sand); transition: border-color .12s ease, box-shadow .12s ease; }
  .lsearch-wrap:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px color-mix(in srgb, var(--gold) 25%, transparent); }
  .lsearch-wrap .i { flex: none; font-size: 16px; }
  .lsearch { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; color: var(--ivory); font: inherit; font-size: 14.5px; }
  .lsearch::placeholder { color: var(--sand); opacity: .7; }
  .lang-btn[hidden], .nolang[hidden] { display: none; }
  .nolang { margin: 4px 2px 0; font-size: 13px; color: var(--sand); text-align: center; padding: 14px 8px; border: 1px dashed var(--ebony-3); border-radius: 12px; }
  .lang-btn .cov { display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 2px; font-size: 11px; font-weight: 800; color: #7fd9a8; font-variant-numeric: tabular-nums; }
  .lang-btn .covbar { flex: 1; height: 5px; border-radius: 99px; background: var(--ebony-3); overflow: hidden; }
  .lang-btn .covbar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--forest-2), #7fd9a8); }
  .lang-btn.unavail b { opacity: .82; } .lang-btn.unavail small { opacity: .7; }
  .chooser .later { display: block; margin: 10px auto 0; border: 0; background: none; color: var(--sand); font-size: 13px; padding: 6px 10px; border-radius: 8px; }
  .chooser .later:hover { color: #fff; background: var(--ebony-2); }

  /* ---------- phones: bottom sheet, larger touch targets ---------- */
  @media (max-width: 640px) {
    .panel { left: 0; right: auto; bottom: 0; width: 100vw; min-width: 100vw; max-width: 100vw; height: min(82vh, 760px); height: min(82dvh, 760px); max-height: calc(100vh - env(safe-area-inset-top) - 8px); max-height: calc(100dvh - env(safe-area-inset-top) - 8px); border-radius: 22px 22px 0 0; transform-origin: bottom center; }
    .panel .band { border-radius: 22px 22px 0 0; }
    .fab { right: 12px; bottom: 12px; padding: 8px 16px 8px 8px; }
    .fab.hidden-under-sheet { opacity: 0; pointer-events: none; }
    .panel.show ~ .fab { display: none; } /* the sheet has its own close button */
    .ph { gap: 8px; padding: 10px 10px 9px 12px; }
    .ph .title { overflow: hidden; }
    .ph .status { font-size: 11.5px; }
    .ph .lang, .lang-select { font-size: 16px; }
    .tabs { padding: 7px 10px; }
    .tab { min-height: 44px; }
    .log { padding: 12px 12px 6px; }
    .msg { max-width: 92%; font-size: 15px; }
    .qchips { padding: 8px 12px; }
    .qchip { min-height: 40px; }
    .askrow { padding: 8px 12px max(12px, env(safe-area-inset-bottom)); }
    .askin { font-size: 16px; }
    .tip { max-width: calc(100vw - 16px); }
    .tr { font-size: 18px; }
    .icon-btn { width: 44px; height: 44px; }
    .say { width: 46px; height: 46px; }
    .toasts { top: max(8px, env(safe-area-inset-top)); width: calc(100vw - 16px); }
    .hint { right: 12px; bottom: 76px; }
    .chooser { left: 0; right: auto; bottom: 0; width: 100vw; max-width: 100vw; max-height: calc(100vh - env(safe-area-inset-top)); max-height: calc(100dvh - env(safe-area-inset-top)); border-radius: 22px 22px 0 0; padding: 22px 14px max(18px, env(safe-area-inset-bottom)); overscroll-behavior: contain; }
    .lang-btn { min-height: 68px; padding: 12px; }
    .chooser .later { min-height: 44px; }
  }
  @media (max-width: 360px) {
    .ph .logo { width: 34px; height: 34px; }
    .ph .lang, .lang-select { font-size: 15px; }
    .tabs { gap: 4px; padding-inline: 8px; }
    .tab { gap: 6px; padding-inline: 6px; font-size: 13px; }
    .chooser { padding-inline: 12px; }
    .langs { gap: 7px; }
    .lang-btn { padding-inline: 10px; }
  }
  @media (max-width: 640px) and (max-height: 500px) {
    .panel { height: calc(100vh - env(safe-area-inset-top)); height: calc(100dvh - env(safe-area-inset-top)); }
    .ph { padding-block: 6px; }
    .tabs { padding-block: 4px; }
    .log { padding-block: 7px 3px; }
    .chooser { max-height: calc(100vh - env(safe-area-inset-top)); max-height: calc(100dvh - env(safe-area-inset-top)); }
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
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
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
    layerEl = layer;
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
    panelVoice = h('div', { class: 'pvoice', role: 'status' });
    panelList = h('div', { class: 'list' });
    pageBtn = h('button', { class: `icon-btn${state.subtitles ? ' on' : ''}`, title: `${ui('ui_page_mode', 'Traduire la page')} (Alt+Shift+T)`, 'aria-label': ui('ui_page_mode', 'Traduire la page') }, icon('languages'));
    pageBtn.addEventListener('click', () => setSubtitles(!state.subtitles, true));
    const readBtn = h('button', { class: 'icon-btn', 'data-tour': 'read', title: `${ui('ui_read_all', 'Tout lire')} (Alt+Shift+L)`, 'aria-label': ui('ui_read_all', 'Tout lire') }, icon('volume'));
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
      h('div', { class: 'ph', title: ui('ui_drag_hint', 'Glisser pour déplacer · double-clic pour replacer') },
        h('div', { class: 'logo' }, icon('languages')),
        h('div', { class: 'title' }, langPicker(), panelStatus, panelVoice),
        ccBtn,
        h('button', { class: 'icon-btn', title: ui('ui_close', 'Fermer'), 'aria-label': ui('ui_close', 'Fermer'), onclick: () => togglePanel(false) }, icon('x'))),
      voiceFix = h('div', { class: 'vfix', hidden: true }),
      tabsBar,
      chatView,
      panelList,
      h('div', { class: 'pf' }, ...(isTouch
        ? [icon('pointer'), ui('ui_hint_touch_short', 'appui long = traduction')]
        : [h('kbd', {}, 'Ctrl'), '+', icon('pointer'), ui('ui_hint_hover_short', 'survol = traduction')]),
        h('button', { class: 'pf-guide', type: 'button', title: ui('tour_replay', 'Revoir le guide'), onclick: () => startTour() }, icon('help'), ui('tour_guide', 'Guide'))));

    fabDot = h('span', { class: 'dot busy' });
    fabCount = h('span', { class: 'count' });
    fab = h('button', { class: 'fab', title: `Alt+Shift+M · ${ui('ui_drag_hint', 'Glisser pour déplacer · double-clic pour replacer')}`, 'aria-label': `Langwa, ${state.pack.name}`, onclick: () => { if (Date.now() - lastDragEnd > 350) togglePanel(); } },
      h('span', { class: 'logo' }, icon('languages'), fabDot), state.pack.name, fabCount);

    layer.append(subLayer, hl, tip, panel, fab, toastBox);
    document.documentElement.append(host);
    draggable(panel.querySelector('.ph'));
    draggable(fab);
    panel.querySelector('.ph').addEventListener('dblclick', e => {
      if (e.target.closest('button, select')) return;
      dock = { ...DOCK_HOME }; placeDock(); saveDock();
    });
    try {
      api.storage.local.get('dock').then(r => { if (r && r.dock) dock = { ...DOCK_HOME, ...r.dock }; placeDock(); }).catch(() => placeDock());
    } catch { placeDock(); }
  }

  // ---------------- move the panel and its button anywhere on screen ----------------
  // dock = distance of the floating button from the right and bottom edges. The panel follows
  // the button: above it when there is room, else below, always fully on screen. On phones the
  // panel stays a bottom sheet; only the button moves.
  const DOCK_HOME = { right: 18, bottom: 18 };
  let dock = { ...DOCK_HOME }, layerEl = null, lastDragEnd = 0;
  const isPhone = () => innerWidth <= 640;
  const saveDock = () => { try { api.storage.local.set({ dock }); } catch { /* not critical */ } };
  function placeDock() {
    if (!fab || !panel) return;
    const m = 8, fw = fab.offsetWidth || 160, fh = fab.offsetHeight || 50;
    dock.right = Math.round(Math.min(Math.max(dock.right, m), Math.max(m, innerWidth - fw - m)));
    dock.bottom = Math.round(Math.min(Math.max(dock.bottom, m), Math.max(m, innerHeight - fh - m)));
    fab.style.right = `${dock.right}px`;
    fab.style.bottom = `${dock.bottom}px`;
    if (isPhone()) { panel.style.right = panel.style.top = panel.style.bottom = panel.style.transformOrigin = ''; return; }
    const pw = panel.offsetWidth, ph = panel.offsetHeight;
    panel.style.right = `${Math.min(Math.max(dock.right, m), Math.max(m, innerWidth - pw - m))}px`;
    const fabTop = innerHeight - dock.bottom - fh, aboveTop = fabTop - 10 - ph, belowTop = innerHeight - dock.bottom + 10;
    const top = aboveTop >= m ? aboveTop : belowTop + ph <= innerHeight - m ? belowTop : Math.max(m, innerHeight - ph - m);
    panel.style.top = `${top}px`;
    panel.style.bottom = 'auto';
    panel.style.transformOrigin = top > fabTop ? 'top right' : 'bottom right';
  }
  addEventListener('resize', () => placeDock());
  /** Pointer drag (mouse, pen, touch). Under 6 px it is still a click. */
  function draggable(handle) {
    let st = null;
    handle.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      if (handle !== fab && e.target.closest('button, select, input, textarea, a, label')) return;
      if (handle !== fab && isPhone()) return; // the bottom sheet does not move
      st = { x: e.clientX, y: e.clientY, r: dock.right, b: dock.bottom, id: e.pointerId, moved: false };
    });
    handle.addEventListener('pointermove', e => {
      if (!st || e.pointerId !== st.id) return;
      const dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!st.moved && Math.hypot(dx, dy) < 6) return;
      if (!st.moved) { st.moved = true; try { handle.setPointerCapture(e.pointerId); } catch { /* ok */ } layerEl.classList.add('dragging'); hideTipSoon(); }
      dock.right = st.r - dx;
      dock.bottom = st.b - dy;
      placeDock();
      e.preventDefault();
    });
    const end = () => {
      if (!st) return;
      if (st.moved) { lastDragEnd = Date.now(); layerEl.classList.remove('dragging'); saveDock(); }
      st = null;
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  /** Language switcher in the panel header (the only way to switch on phones). */
  // Languages, most complete first: translated share, then automatic drafts, then by name.
  const rankLangs = langs => Object.entries(langs || {}).sort(([, a], [, b]) =>
    (b.count || 0) - (a.count || 0) || (b.machineTranslation ? 1 : 0) - (a.machineTranslation ? 1 : 0) || a.name.localeCompare(b.name));
  const coverageText = l => (l.count ? `${l.pct ?? 0} %` : l.machineTranslation
    ? (BASE === 'en' ? 'Automatic draft' : 'Brouillon automatique') : ui('ui_soon', BASE === 'en' ? 'Soon' : 'Bientôt'));
  const fold = s => (s || '').normalize('NFD').replace(/[̀-ͯ'’ʼ]/g, '').toLowerCase();

  function langPicker() {
    const langs = rankLangs(state.langs);
    if (langs.length < 2) return h('div', { class: 'lang' }, state.pack.name);
    const sel = h('select', { class: 'lang lang-select', 'aria-label': ui('ui_language', 'Langue') },
      langs.map(([code, l]) => {
        const o = h('option', { value: code }, code === state.pack.code ? l.name : `${l.name} · ${coverageText(l)}`);
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
    const langs = rankLangs(state.langs);
    // Search: names, other names, regions, towns; accents and apostrophes ignored. Filtering only
    // shows or hides the buttons already built, so it answers on every keystroke.
    const buttons = langs.map(([code, l]) => {
      const meter = l.count
        ? h('span', { class: 'cov' }, h('span', { class: 'covbar', 'aria-hidden': 'true' }, h('i', { style: `width:${l.pct ?? 0}%` })), h('span', {}, coverageText(l)))
        : h('span', { class: 'soon' }, coverageText(l));
      const b = h('button', {
        class: `lang-btn${l.count || l.machineTranslation ? '' : ' unavail'}`, onclick: () => choose(code),
        title: l.count ? `${l.count} / ${l.total} ${BASE === 'en' ? 'phrases translated' : 'phrases traduites'}${l.verified ? ` · ${l.verified} ${BASE === 'en' ? 'validated by a speaker' : 'validées par un locuteur'}` : ''}` : '',
      }, h('b', {}, l.name), h('small', {}, l.region || ''), meter);
      b.dataset.q = fold(`${code} ${l.name} ${l.region || ''} ${l.search || ''}`);
      return b;
    });
    const none = h('p', { class: 'nolang', hidden: true }, BASE === 'en' ? 'No language found. Try another name or a town.' : 'Aucune langue trouvée. Essayez un autre nom ou une ville.');
    const search = h('input', { type: 'search', class: 'lsearch', placeholder: BASE === 'en' ? 'Search: Pidgin, Fulani, Bamiléké, Kumbo…' : 'Rechercher : pidgin, peul, bamiléké, Kumbo…', 'aria-label': BASE === 'en' ? 'Search a language' : 'Rechercher une langue', autocomplete: 'off', spellcheck: 'false' });
    search.addEventListener('input', () => {
      const words = fold(search.value).split(/\s+/).filter(Boolean);
      let shown = 0;
      for (const b of buttons) { const ok = words.every(w => b.dataset.q.includes(w)); b.hidden = !ok; shown += ok; }
      none.hidden = shown > 0;
    });
    search.addEventListener('keydown', e => {
      e.stopPropagation(); // typing never triggers page shortcuts
      if (e.key === 'Enter') { const first = buttons.find(b => !b.hidden); if (first) first.click(); }
    });
    const card = h('div', { class: 'chooser', role: 'dialog', 'aria-label': ui('ui_choose', 'Quelle langue parlez-vous ?') },
      h('div', { class: 'head' },
        h('div', { class: 'logo' }, icon('languages')),
        h('div', {}, h('h3', {}, ui('ui_choose', 'Quelle langue parlez-vous ?')), h('p', {}, ui('ui_choose_sub', 'Langwa affichera la banque dans cette langue.')))),
      h('label', { class: 'lsearch-wrap' }, icon('search'), search),
      h('div', { class: 'langs' }, buttons),
      none,
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
    if (r.status === 'gist') return r.verified ? 'gist' : 'mt';
    if (r.status === 'blocked') return 'block';
    return 'none';
  }
  function pillFor(r) {
    if (r.status === 'gist' && !r.verified) {
      return h('span', { class: 'pill mt' }, icon('alert'), ui('ui_draft_summary', BASE === 'en' ? 'Unvalidated summary' : 'R\u00e9sum\u00e9 non valid\u00e9'));
    }
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
    return !!(state.pack && ((mode === 'mms' && state.pack.mms) || (mode === 'africa' && state.pack.africaTts)
      || (mode === 'auto' && state.localVoice && state.pack.africaTts)));
  };
  /** Automatic voice: learn whether the local voice server runs (cheap, cached by the background). */
  async function refreshVoice() {
    if (!state.active || document.hidden) return;
    const v = await send({ type: 'voiceStatus' }).catch(() => null);
    const was = state.localVoice;
    state.localVoice = !!(v && v.ready);
    // Installing or starting: the cards show it live, checked every 3 s until the voice is ready.
    state.voice = v && !v.ready && v.info ? v.info : null;
    const key = `${state.localVoice}|${state.voice ? `${state.voice.status}${Math.round(state.voice.progress * 100)}` : ''}`;
    if (key !== state.voiceKey || was !== state.localVoice) { state.voiceKey = key; refreshChips(); }
    clearTimeout(state.voiceTimer);
    if (state.voice) state.voiceTimer = setTimeout(refreshVoice, 3000);
  }
  /**
   * Panel header: which voice reads, live, for the assistant and the translations alike.
   * Built again only when the state changes; while installing only the numbers move.
   */
  function renderPanelVoice() {
    if (!panelVoice) return;
    const mode = state.settings && state.settings.tts && state.settings.tts.mode;
    panelVoice.hidden = mode === 'none';
    const natural = !!(state.pack && state.pack.africaTts) && mode !== 'mms';
    const v = natural && !state.localVoice ? state.voice : null;
    const s = natural && state.localVoice ? 'ready' : v ? v.status : 'browser';
    const pct = v ? Math.max(1, Math.round((v.progress || 0) * 100)) : 0;
    // The natural voice is the default; when it is not running yet, say so and offer the two ways
    // to get a natural voice: online now (Microsoft/Google), or the offline one on this computer.
    const notReady = s === 'browser' && natural;
    const onlineNow = notReady && onlineOn();
    const label = s === 'ready' ? `✓ ${ui('ui_voice_natural', 'Voix naturelle')}`
      : s === 'installing' ? `${ui('ui_voice_natural', 'Voix naturelle')} · ${pct} %`
        : s === 'loading' ? ui('ui_voice_starting', 'voix naturelle, démarrage…')
          : onlineNow ? ui('ui_voice_online_short', 'Voix en ligne')
            : notReady ? ui('ui_voice_not_ready', 'Voix pas prête') : voiceName('synthetic');
    const eta = v && v.etaSec != null ? (v.etaSec < 60 ? ' · <1 min' : ` · ~${Math.round(v.etaSec / 60)} min`) : '';
    if (s === 'installing' && panelVoice.dataset.s === 'installing') {
      panelVoice.querySelector('.vt').textContent = label + eta;
      panelVoice.querySelector('.vprog i').style.width = `${pct}%`;
      return;
    }
    panelVoice.dataset.s = onlineNow ? 'online' : notReady ? 'notready' : s;
    panelVoice.setAttribute('aria-live', s === 'installing' ? 'off' : 'polite');
    let prog = null;
    if (s === 'installing') { const i = h('i'); i.style.width = `${pct}%`; prog = h('span', { class: 'vprog', 'aria-hidden': 'true' }, i); }
    const ic = onlineNow ? icon('cloud') : s === 'ready' ? icon('cpu') : s === 'loading' ? icon('loader', 'spin') : s === 'installing' ? icon('loader', 'spin') : icon('monitor');
    const setup = notReady ? h('button', { class: 'pv-setup', type: 'button', 'aria-expanded': String(!!voiceFix && !voiceFix.hidden), onclick: () => toggleVoiceFix() }, ui('ui_voice_choose', 'Choisir')) : null;
    if (!notReady && voiceFix) voiceFix.hidden = true;
    panelVoice.replaceChildren(ic, h('span', { class: 'vt' }, label + eta), ...(prog ? [prog] : []), ...(setup ? [setup] : []));
    panelVoice.title = s === 'browser' && natural
      ? ui('ui_voice_hint', 'Voix du navigateur. Pour une voix plus naturelle, lancez « Start Langwa voice » sur cet ordinateur.')
      : panelVoice.textContent;
  }

  /** An online natural voice (Microsoft in Edge, Google in Chrome) exists for this language. */
  function onlineVoiceAvailable() {
    const L = globalThis.LangwaSpeech;
    if (!L || !L.pickVoice) return false;
    const prefs = [...((state.pack && state.pack.voices) || []).map(x => x.toLowerCase()), 'en', 'fr'];
    const on = L.pickVoice(prefs, true);
    return !!on && on.localService === false;
  }
  const onlineOn = () => !!(state.settings && state.settings.onlineVoice) && onlineVoiceAvailable();
  const idleSrc = () => (onlineOn() ? 'online' : 'browser');

  /** The two ways to a natural voice when it is not on this computer: online now, or offline. */
  function toggleVoiceFix(force) {
    if (!voiceFix) return;
    const open = force ?? voiceFix.hidden;
    voiceFix.hidden = !open;
    const btn = panelVoice && panelVoice.querySelector('.pv-setup');
    if (btn) btn.setAttribute('aria-expanded', String(open));
    if (!open) return;
    const on = !!(state.settings && state.settings.onlineVoice);
    const opt = (ic, title, sub, onclick, cls = '') => h('button', { class: `vf-opt ${cls}`, type: 'button', onclick }, icon(ic), h('span', {}, h('b', {}, title), h('small', {}, sub)));
    const done = () => { toggleVoiceFix(false); renderPanelVoice(); refreshChips(); };
    voiceFix.replaceChildren(
      h('div', { class: 'vf-head' }, h('b', {}, ui('ui_vfix_title', 'Une voix plus naturelle')),
        h('button', { class: 'vf-x', type: 'button', 'aria-label': ui('ui_close', 'Fermer'), onclick: () => toggleVoiceFix(false) }, icon('x'))),
      onlineVoiceAvailable()
        ? (on
          ? opt('cloud', ui('ui_vfix_stop', 'Arrêter la voix en ligne'), ui('ui_vfix_stop_sub', 'Revenir à la voix intégrée de cet appareil.'), () => { setLight({ onlineVoice: false }); done(); })
          : opt('cloud', ui('ui_vfix_online', 'Utiliser la voix naturelle en ligne'), ui('ui_vfix_online_sub', 'Tout de suite. Le texte lu est envoyé à Microsoft ou Google.'), () => { setLight({ onlineVoice: true }); done(); }, 'primary'))
        : h('p', { class: 'vf-note' }, ui('ui_vfix_no_online', 'Ce navigateur n’a pas de voix en ligne. Edge en propose de très naturelles.')),
      opt('cpu', ui('ui_vfix_offline', 'Installer la voix naturelle hors ligne'), ui('ui_vfix_offline_sub', 'Privée, sur cet ordinateur. Environ 700 Mo, une seule fois.'), () => { send({ type: 'openOptions' }); toggleVoiceFix(false); }));
  }
  /** Idle voice chips follow the local voice: progress while it installs, then "Local voice". */
  function refreshChips() {
    renderPanelVoice();
    if (!shadow) return;
    for (const chip of shadow.querySelectorAll('.vchip:not(.live)')) {
      if (/^(browser|local|online)$/.test(chip.dataset.src)) setChip(chip, ttsOn() ? 'local' : idleSrc());
    }
  }
  setInterval(refreshVoice, 20000);
  document.addEventListener('visibilitychange', refreshVoice);

  const bars = () => h('span', { class: 'bars', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'));
  const voiceName = v => (v === 'human' ? ui('ui_voice_human', 'Voix humaine') : v === 'neural' ? ui('ui_voice_local', 'Voix locale') : ui('ui_voice_browser', 'Voix du navigateur'));
  /** Name of the local model in use, shown next to "Voix locale". */
  const modelName = () => { const m = state.settings && state.settings.tts && state.settings.tts.mode; return m === 'africa' || m === 'auto' ? 'Africa TTS' : m === 'mms' ? 'MMS' : ''; };
  const WHY = {
    offline: ['ui_voice_why_offline', 'voix locale éteinte'],
    loading: ['ui_voice_why_loading', 'voix locale en chargement'],
    slow: ['ui_voice_why_slow', 'voix locale trop lente'],
    error: ['ui_voice_why_error', 'voix locale indisponible'],
    none: ['ui_voice_why_none', 'aucune voix sur cet appareil'],
  };
  const SRC = {
    local: ['cpu', () => ui('ui_voice_natural', 'Voix naturelle')], // model name in the tooltip
    wait: ['loader', () => ui('ui_voice_preparing', 'Voix locale, préparation…')],
    browser: ['monitor', () => voiceName('synthetic')],
    online: ['cloud', () => ui('ui_voice_online', 'Voix naturelle en ligne')],
    human: ['user', () => voiceName('human')],
  };
  /**
   * The voice chip under a translation. Before playing it says which voice is planned; while
   * playing it shows, live, who really speaks, and why the browser voice took over if it did.
   */
  function voiceChip(steps) {
    if (!steps) return null;
    const chip = h('div', { class: 'vchip', role: 'status', 'aria-live': 'polite' });
    setChip(chip, steps.voice === 'neural' ? 'local' : steps.voice === 'human' ? 'human' : idleSrc());
    return chip;
  }
  function setChip(chip, src, why, live = false) {
    const [ic, text] = SRC[src] || SRC.browser;
    // Browser voice for now, natural voice on its way: say so, with its progress.
    const v = src === 'browser' && !why && !live && state.voice && state.pack && state.pack.africaTts ? state.voice : null;
    const installing = !!v && v.status === 'installing';
    const pct = v ? Math.max(1, Math.round((v.progress || 0) * 100)) : 0;
    const note = !v ? '' : installing ? ` · ${ui('ui_voice_installing', 'voix naturelle')} ${pct} %` : ` · ${ui('ui_voice_starting', 'voix naturelle, démarrage…')}`;
    const bar = chip.querySelector('.vprog i');
    if (installing && bar && chip.dataset.src === src) { // update in place, so the bar glides
      bar.style.width = `${pct}%`;
      chip.querySelector('.why').textContent = note;
      chip.title = chip.textContent;
      return;
    }
    chip.dataset.src = src;
    chip.classList.toggle('live', live && src !== 'wait');
    chip.classList.toggle('warm', !!v);
    chip.setAttribute('aria-live', v ? 'off' : 'polite'); // no announcement every 3 s
    const w = why && WHY[why];
    const extra = w ? ` · ${ui(w[0], w[1])}` : note;
    let prog = null;
    if (installing) { const i = h('i'); i.style.width = `${pct}%`; prog = h('span', { class: 'vprog', 'aria-hidden': 'true' }, i); }
    chip.replaceChildren(h('span', { class: 'dot' }), icon(ic), h('span', { class: 'vt' }, text(), extra ? h('span', { class: 'why' }, extra) : null), ...(prog ? [prog] : []));
    chip.title = src === 'local' && modelName() ? `${chip.textContent} · ${modelName()}` : chip.textContent;
  }
  const chipFor = b => { const host = b && (b.closest('.block') || b.closest('.item') || b.closest('.tip')); return host && host.querySelector('.vchip'); };

  /** One tap to listen, tap again to stop. Shows which voice will speak (human or synthetic). */
  function sayButton(steps, label, { compact = false } = {}) {
    if (!steps) return null;
    const idle = () => [icon('volume'), compact ? null : h('span', { class: 'lbl' }, label)];
    const b = h('button', { class: `say${compact ? '' : ' wide'}`, title: `${label} · ${voiceName(steps.voice)}`, 'aria-label': label }, ...idle());
    b.addEventListener('click', ev => {
      ev.stopPropagation();
      if (b.classList.contains('on')) { player.stop(); if (!player.isPlaying()) { b.classList.remove('on'); fill(b, ...idle()); } return; }
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
  /**
   * Plays steps and keeps the user informed at every moment, on the button that started it:
   * preparing (spinner, "Préparation…", "Encore un instant…" after 4 s), playing (bars,
   * "Arrêter"), and a short, clear failure state when nothing could be heard.
   */
  async function speak(planned, b, idle) {
    if (!planned) return;
    const wide = b && !compact(b);
    const label = text => (wide ? h('span', { class: 'lbl' }, text) : null);
    const phase = (name, text) => {
      if (!b) return;
      b.dataset.phase = name;
      b.setAttribute('aria-busy', String(name !== 'play'));
      b.setAttribute('aria-label', text);
      b.title = text;
      fill(b, name === 'play' ? bars() : icon('loader', 'spin'), label(text));
    };
    if (b) b.classList.add('on');
    phase('prep', ui('ui_preparing', 'Préparation…'));
    let playing = false;
    const slow = setTimeout(() => { if (!playing) phase('slow', ui('ui_still_preparing', 'Encore un instant…')); }, 4000);
    // The voice is decided now, not when the card or chat bubble was drawn: the local voice
    // may have started (or stopped) since. The check is cached, so this takes milliseconds.
    if (state.settings && state.settings.tts && state.settings.tts.mode === 'auto') await refreshVoice();
    const steps = (planned.raw && player.prepare(planned.raw, voiceOpts())) || planned;
    if (b && !b.classList.contains('on')) { clearTimeout(slow); return; } // stopped while checking
    const chip = chipFor(b);
    player.play(steps,
      endInfo => {
        clearTimeout(slow);
        if (chip) chip.classList.remove('live');
        if (!b) return;
        b.classList.remove('on');
        delete b.dataset.phase;
        b.removeAttribute('aria-busy');
        b.setAttribute('aria-label', listenLabel());
        fill(b, ...idle());
        if (endInfo && !endInfo.spoke && !endInfo.stopped) noVoice(b, chip, idle, wide);
      },
      (src, why) => {
        if (src === 'local') state.localVoice = true;
        if (why === 'offline' || why === 'loading') state.localVoice = false;
        if (chip) setChip(chip, src, why, true);
        if (src === 'wait') { if (!playing) phase(b && b.dataset.phase === 'slow' ? 'slow' : 'prep', b && b.dataset.phase === 'slow' ? ui('ui_still_preparing', 'Encore un instant…') : ui('ui_voice_preparing', 'Voix locale, préparation…')); return; }
        playing = true;
        clearTimeout(slow);
        phase('play', ui('ui_stop', 'Arrêter'));
        if (b) b.title = `${ui('ui_stop', 'Arrêter')} · ${(SRC[src] || SRC.browser)[1]()}`;
      });
  }
  /** Nothing could be heard (no voice on this device, audio blocked): say it, briefly. */
  function noVoice(b, chip, idle, wide) {
    const text = ui('ui_no_voice', 'Aucune voix disponible sur cet appareil');
    b.classList.add('fail');
    b.setAttribute('aria-label', text);
    b.title = text;
    fill(b, icon('mute'), wide ? h('span', { class: 'lbl' }, ui('ui_no_voice_short', 'Pas de voix')) : null);
    if (chip) setChip(chip, 'browser', 'none');
    setTimeout(() => { if (b.classList.contains('fail')) { b.classList.remove('fail'); b.setAttribute('aria-label', listenLabel()); fill(b, ...idle()); } }, 2800);
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
      // Original right under the translation (they read as a pair), then help, then one footer
      // row with the voice and the validation status.
      shown && shownText(u).trim() === u.text.trim() ? null : h('div', { class: 'orig' }, h('b', {}, ui('ui_original', 'Original')), u.text),
      r.explain ? h('div', { class: 'explain' }, icon('bulb'), h('span', {}, r.explain)) : null,
      shown ? null : wordsRow(r),
      h('div', { class: 'meta' }, shown ? voiceChip(stepsFor(r)) : null, chipsFor(u.text), shown || r.status === 'blocked' ? pillFor(r) : null));
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
    if (state.panelOpen) clearToasts();
    panel.classList.toggle('show', state.panelOpen);
    if (state.panelOpen) placeDock();
    fab.classList.toggle('hidden-under-sheet', state.panelOpen && innerWidth <= 640);
    if (state.panelOpen) { setTab(state.tab || 'chat'); hideHint(); refreshVoice(); }
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
    l = { font: cs.fontFamily, size: parseFloat(cs.fontSize) || 15, weight: cs.fontWeight, color: cs.color, align: cs.textAlign, bg, lh: cs.lineHeight,
      tt: cs.textTransform, ls: parseFloat(cs.letterSpacing) || 0 };
    lookCache.set(el, l);
    return l;
  }

  /** Width of a text in the page's font, at 1px (cached: measured once per text and font). */
  const measureCtx = document.createElement('canvas').getContext('2d');
  const widthCache = new Map();
  function textWidth(text, l) {
    const t = l.tt === 'uppercase' ? text.toUpperCase() : text;
    const k = `${l.weight}|${l.font}|${t}`;
    let w = widthCache.get(k);
    if (w == null) {
      measureCtx.font = `${l.weight} 100px ${l.font}`;
      w = measureCtx.measureText(t).width / 100;
      if (widthCache.size > 3000) widthCache.clear();
      widthCache.set(k, w);
    }
    return w;
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
        // One-line originals (labels, tabs, buttons) stay on one line: the font shrinks just enough
        // to fit (down to 70 %), never breaking a word. Longer, multi-line texts wrap between words.
        let ratio;
        // One line if the original itself fits on one line in its box (buttons have padding: height alone misleads).
        let oneLine = b.height <= l.size * 4 && textWidth(u.text, l) * l.size + l.ls * u.text.length <= b.width + 4;
        if (oneLine) {
          const need = textWidth(r.text, l) * l.size + l.ls * r.text.length + 4; // +4: padding
          ratio = Math.min(1, avail / need);
          if (ratio < 0.7) { ratio = 0.78; oneLine = false; } // far too long: wrap between words instead
        } else {
          ratio = Math.min(1, Math.max(0.78, Math.sqrt(u.text.length / Math.max(1, r.text.length))));
        }
        const isButton = /^(BUTTON|A)$/.test(u.el.tagName) || u.el.getAttribute('role') === 'button';
        const s = h('div', { class: 'sub' }, r.text);
        Object.assign(s.style, {
          whiteSpace: oneLine ? 'nowrap' : 'normal', textTransform: l.tt, letterSpacing: l.ls ? `${l.ls}px` : '',
          top: `${b.top}px`, left: `${b.left}px`, minWidth: `${b.width}px`, maxWidth: oneLine ? 'none' : `${avail}px`, width: 'max-content', minHeight: `${b.height}px`,
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

  const toastQueue = [];
  let activeToast = null;
  let toastTimer = null;
  function clearToasts() {
    toastQueue.length = 0;
    clearTimeout(toastTimer);
    toastTimer = null;
    activeToast?.remove();
    activeToast = null;
    if (toastBox) toastBox.replaceChildren();
  }
  function showNextToast() {
    if (activeToast || !toastBox || state.panelOpen || !toastQueue.length) return;
    const u = toastQueue.shift();
    const r = u.result;
    const trusted = r.verified === true && (r.status === 'ok' || r.status === 'gist');
    const kind = r.kind || 'warning';
    const title = kind === 'error'
      ? (BASE === 'en' ? 'Error message' : 'Message d\u2019erreur')
      : kind === 'success'
        ? (BASE === 'en' ? 'Success message' : 'Confirmation')
        : (BASE === 'en' ? 'Security warning' : 'Avertissement de s\u00e9curit\u00e9');
    const message = trusted ? shownText(u) : u.text;
    const stateText = trusted
      ? (r.status === 'gist'
        ? (BASE === 'en' ? 'Validated safe summary' : 'R\u00e9sum\u00e9 valid\u00e9')
        : (BASE === 'en' ? 'Validated by a speaker' : 'Valid\u00e9 par un locuteur'))
      : (BASE === 'en'
        ? 'Unvalidated translation; showing the original message.'
        : 'Traduction non valid\u00e9e ; texte original affich\u00e9.');
    const t = h('div', { class: `toast k-${kind}`, role: 'alert' });
    const dismiss = () => {
      if (activeToast !== t) return;
      activeToast = null;
      t.remove();
      clearTimeout(toastTimer);
      toastTimer = setTimeout(showNextToast, 180);
    };
    t.append(
      h('div', { class: 'toast-head' }, icon(kind === 'success' ? 'check' : 'alert'), h('strong', {}, title)),
      h('div', { class: 'toast-copy' }, message),
      h('div', { class: 'toast-state' }, stateText),
      h('button', { class: 'toast-open', onclick: () => { clearToasts(); togglePanel(true); setTab('list'); } }, BASE === 'en' ? 'View full message' : 'Voir le message complet'),
      h('button', { class: 'x', 'aria-label': ui('ui_close', 'Fermer'), onclick: dismiss }, icon('x')),
      h('div', { class: 'bar' }));
    activeToast = t;
    toastBox.replaceChildren(t);
    t.querySelector('.bar').addEventListener('animationend', dismiss, { once: true });
    if (state.settings.autoSpeak !== false && trusted) {
      const steps = stepsFor(r);
      if (steps) player.play(steps);
    }
  }
  function toast(u) {
    if (!state.settings.toasts || !toastBox || state.panelOpen) return;
    toastQueue.push(u);
    if (toastQueue.length > 3) toastQueue.shift();
    showNextToast();
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
  // Guided tour: first time after choosing a language, or again from "?" / the popup.
  // Points at the real controls one by one (spotlight + card), Back / Next / Skip, keyboard
  // (Esc, arrows, Enter). Steps whose control is not on screen are skipped. Nothing exists
  // until it runs; everything is removed when it ends.
  // ======================================================================================
  let tourEl = null;
  function tourSteps() {
    const lang = state.pack ? state.pack.name : '';
    // A translated sentence in the page's main content (not a banner or top bar), headings first.
    const shown = state.units.filter(u => u.result && (u.result.status === 'ok' || u.result.status === 'gist') && !u.result.value
      && !u.attr && u.el.getBoundingClientRect().width > 40 && visible(u.el)
      && !u.el.closest('nav, header, footer, [role="banner"], [role="navigation"]')
      && getComputedStyle(u.el).position !== 'fixed' && u.el.getBoundingClientRect().top + scrollY > 120);
    const sample = shown.find(u => /^H[1-3]$/.test(u.el.tagName)) || shown.find(u => u.el.closest('main')) || shown[0];
    const inPanel = sel => () => { if (!state.panelOpen) togglePanel(true); setTab('chat'); return panel && panel.querySelector(sel); };
    return [
      { title: ui('tour_welcome_t', 'Bienvenue dans Langwa'), body: ui('tour_welcome_b', 'Langwa vous montre cette page en {lang}, à lire et à écouter. Une visite rapide : moins d’une minute.').replace('{lang}', lang), next: ui('tour_start', 'Commencer la visite') },
      sample && { target: () => {
        if (state.panelOpen) togglePanel(false);
        sample.el.scrollIntoView({ block: 'center', behavior: 'instant' });
        const both = () => { const a = sample.el.getBoundingClientRect(); const b = tip.classList.contains('show') ? tip.getBoundingClientRect() : a;
          const left = Math.min(a.left, b.left); const top = Math.min(a.top, b.top); const right = Math.max(a.right, b.right); const bottom = Math.max(a.bottom, b.bottom);
          return { left, top, right, bottom, width: right - left, height: bottom - top }; };
        return { isConnected: true, getBoundingClientRect: both };
      },
        // Once the scroll has settled (scrolling closes cards), open the real translation card.
        after: place => setTimeout(() => { if (!tourEl) return; showTip([sample], sample.el); tip.classList.add('intour'); place(); }, 120),
        title: isTouch ? ui('tour_point_touch_t', 'Appuyez longuement sur un texte') : ui('tour_point_t', 'Maintenez Ctrl et pointez un texte'),
        body: ui('tour_point_b', 'Sa traduction s’affiche juste dessous, avec le bouton Écouter. Les montants et les noms restent exactement ceux de la page.') },
      { target: () => { if (state.panelOpen) togglePanel(false); return fab; }, title: ui('tour_fab_t', 'Le bouton Langwa'), body: ui('tour_fab_b', 'Il ouvre le panneau. Le chiffre rouge compte les messages importants de la page.') },
      { target: inPanel('.askrow'), title: ui('tour_ask_t', 'Posez votre question'), body: ui('tour_ask_b', 'Touchez une question toute prête, écrivez, ou touchez le micro et parlez. Langwa répond dans votre langue, avec les montants de la page.') },
      { target: () => (state.panelOpen || togglePanel(true), panel && panel.querySelector('[data-tour="read"]')), title: ui('tour_read_t', 'Écoutez toute la page'), body: ui('tour_read_b', 'Langwa lit la page à voix haute, les messages importants d’abord.') },
      { target: () => (state.panelOpen || togglePanel(true), pageBtn), title: ui('tour_page_t', 'Traduisez toute la page'), body: ui('tour_page_b', 'La traduction s’affiche sur chaque texte de la page. Touchez encore pour revenir à l’original.') },
      { target: () => (state.panelOpen || togglePanel(true), panelVoice && !panelVoice.hidden ? panelVoice : null), title: ui('tour_voice_t', 'Qui lit à voix haute'), body: ui('tour_voice_b', 'La voix du navigateur, ou la voix naturelle si elle est installée sur cet ordinateur. Son installation s’affiche ici en direct.') },
      { target: () => (state.panelOpen || togglePanel(true), panel && panel.querySelector('.lang-select')), title: ui('tour_lang_t', 'Changez de langue'), body: ui('tour_lang_b', 'À tout moment, ici. Les langues les plus complètes sont en premier.') },
      { title: ui('tour_done_t', 'C’est prêt !'), body: ui('tour_done_b', 'Pour revoir ce guide : le bouton Guide en bas du panneau, ou la fenêtre Langwa dans la barre du navigateur.'), next: ui('tour_finish', 'Terminer') },
    ].filter(Boolean);
  }

  function endTour(done = true) {
    if (!tourEl) return;
    tourEl._off();
    tourEl.remove();
    if (tip) tip.classList.remove('intour', 'show');
    tourEl = null;
    if (done) api.storage.local.set({ tourDone: true }).catch(() => {});
  }

  function startTour() {
    if (!host || !state.active) return;
    endTour(false);
    hideHint();
    hideTipSoon();
    const steps = tourSteps();
    let i = 0;
    let target = null;
    const spot = h('div', { class: 'tspot' });
    const count = h('span', { class: 'tstep' });
    const dots = h('span', { class: 'tdots', 'aria-hidden': 'true' }, steps.map(() => h('i')));
    const title = h('h4', { id: 'langwa-tour-title' });
    const body = h('p');
    const back = h('button', { class: 'tback', type: 'button' }, ui('tour_back', 'Retour'));
    const next = h('button', { class: 'tnext', type: 'button' });
    const skip = h('button', { class: 'tskip', type: 'button' }, ui('tour_skip', 'Passer le guide'));
    const doneMark = h('div', { class: 'tdone', hidden: true }, icon('check'));
    const content = h('div', { class: 'tcontent', 'aria-live': 'polite' }, doneMark, title, body);
    const card = h('div', { class: 'tcard', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'langwa-tour-title' },
      h('div', { class: 'thead' }, count, dots, skip), content, h('div', { class: 'tbtns' }, back, next));
    tourEl = h('div', { class: 'tour' }, spot, card);
    shadow.querySelector('.layer').append(tourEl);

    const place = () => {
      const pad = 8;
      const vw = innerWidth;
      const vh = innerHeight;
      const r = target && target.isConnected ? target.getBoundingClientRect() : null;
      const has = r && r.width > 0 && r.height > 0;
      tourEl.classList.toggle('nospot', !has);
      if (has) Object.assign(spot.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + 2 * pad}px`, height: `${r.height + 2 * pad}px` });
      if (vw <= 640) { // phones: a sheet at the bottom, or at the top when the control is in the lower half
        card.style.left = card.style.top = '';
        card.classList.toggle('top', !!has && (r.top + r.bottom) / 2 > vh / 2);
        return;
      }
      const cw = card.offsetWidth;
      const ch = card.offsetHeight;
      let left;
      let top;
      if (!has) { left = (vw - cw) / 2; top = (vh - ch) / 2; } else if (r.bottom + pad + 14 + ch < vh) { top = r.bottom + pad + 14; left = r.left; } else if (r.top - pad - 14 - ch > 0) { top = r.top - pad - 14 - ch; left = r.left; } else if (r.left - pad - 14 - cw > 0) { left = r.left - pad - 14 - cw; top = r.top; } else { left = r.right + pad + 14; top = r.top; }
      card.style.left = `${Math.max(12, Math.min(left, vw - cw - 12))}px`;
      card.style.top = `${Math.max(12, Math.min(top, vh - ch - 12))}px`;
    };
    const go = (n, dir = 1) => {
      if (n < 0) return;
      if (n >= steps.length) { endTour(true); return; }
      i = n;
      const st = steps[i];
      if (tip) tip.classList.remove('intour', 'show');
      let t = null;
      try { t = st.target ? st.target() : null; } catch { t = null; }
      if (st.target && !t) { go(n + dir, dir); return; } // control not on screen: skip this step
      target = t;
      count.textContent = `${i + 1} / ${steps.length}`;
      [...dots.children].forEach((d, k) => { d.classList.toggle('on', k < i); d.classList.toggle('cur', k === i); });
      content.classList.remove('fwd', 'bwd');
      void content.offsetWidth; // restart the slide-in
      content.classList.add(dir > 0 ? 'fwd' : 'bwd');
      doneMark.hidden = i !== steps.length - 1;
      title.textContent = st.title;
      body.textContent = st.body;
      next.textContent = st.next || (i === steps.length - 1 ? ui('tour_finish', 'Terminer') : ui('tour_next', 'Suivant'));
      back.hidden = i === 0;
      skip.hidden = i === steps.length - 1;
      requestAnimationFrame(() => { place(); next.focus({ preventScroll: true }); if (st.after) st.after(place); });
    };
    let raf = 0;
    const onMove = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
    const onKey = e => {
      if (!tourEl) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); endTour(true); }
      else if (e.key === 'ArrowRight' || (e.key === 'Enter' && e.composedPath()[0] !== skip && e.composedPath()[0] !== back)) { e.preventDefault(); e.stopPropagation(); go(i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); go(i - 1, -1); }
    };
    addEventListener('resize', onMove, { passive: true });
    addEventListener('scroll', onMove, { passive: true, capture: true });
    addEventListener('keydown', onKey, true);
    tourEl._off = () => { removeEventListener('resize', onMove); removeEventListener('scroll', onMove, { capture: true }); removeEventListener('keydown', onKey, true); cancelAnimationFrame(raf); };
    next.onclick = () => go(i + 1);
    back.onclick = () => go(i - 1, -1);
    skip.onclick = () => endTour(true);
    go(0);
  }

  /** First time on a page after choosing a language: the tour, once (skip counts as seen). */
  async function maybeTour() {
    try {
      const { tourDone } = await api.storage.local.get('tourDone');
      if (tourDone) return;
    } catch { return; }
    setTimeout(() => { if (state.active && !tourEl) startTour(); }, 900); // let the page be read first
  }

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
    // Lamnso' has a dedicated local model and should use it whenever this language is
    // selected, even when the optional general MT setting is left at "none".
    if ((!state.settings.mt || state.settings.mt.mode === 'none') && state.pack.code !== 'lns') return Promise.resolve(null);
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
    renderPanelVoice(); // last known voice state at once; refreshVoice() below brings the live one
    if (state.panelOpen) togglePanel(true);
    state.active = true;
    state.startedAt = Date.now();
    refreshVoice(); // automatic voice: is the local model running? (answer arrives in ~ms)
    listen(true);
    scan();
    if (settings.pageMode) setSubtitles(true); // page translation stays on between pages
    maybeTour(); // first time: the guided tour (replaces the one-line hint)
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
    if (msg.type === 'startTour') startTour();
  });

  start();
})();
