<?php

namespace semappsBundle\Controller;

use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use semappsBundle\Form\RegisterType;
use semappsBundle\Repository\UserRepository;
use semappsBundle\Form\AdminSettings;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Form;
use Symfony\Component\HttpFoundation\Request;

class AdministrationController extends Controller
{

    public function registerAction(Request $request,$token)
    {
        $encryption = $this->get('semapps_bundle.encryption');
        $inviteManager = $this->get('semapps_bundle.invite_manager');


        if($this->getUser()) {
            $this->addFlash('info', $this->get('translator')->trans("admin.register.must_dc",[],"controller"));
            return $this->redirectToRoute("home");
        }

        // voter pour le token
        $email = $inviteManager->verifyInvite($token);
        if(!$email){
            $this->addFlash('info', $this->get('translator')->trans("admin.register.no_token",[],"controller"));
            return $this->redirectToRoute("fos_user_security_login");
        }
        //get the form
        $form = $this->createForm(
            RegisterType::class,
            null,
            // Options.
            []
        );
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $newUser = $form->getData();

            $newUser->setPassword(
                password_hash($form->get('password')->getData(), PASSWORD_BCRYPT, ['cost' => 13])
            );

            $newUser->setSfUser($encryption->encrypt($form->get('password')->getData()));

            //Set the roles
            $newUser->addRole('ROLE_MEMBER');

            $newUser->setEnabled(true);

            // Save it.
            $em = $this->getDoctrine()->getManager();
            $em->persist($newUser);
            try {
                $em->flush();
            } catch (UniqueConstraintViolationException $e) {
                $this->addFlash('danger', $this->get('translator')->trans("admin.register.already_exist",[],"controller"));

                return $this->redirectToRoute('fos_user_resetting_request',array('email' => $newUser->getEmail()));
            }
            $this->addFlash('success', $this->get('translator')->trans("admin.register.success",[],"controller"));


            return $this->redirectToRoute('fos_user_security_login');
        }
        // Fill form
        return $this->render(
            'semappsBundle:Admin:register.html.twig',
            array(
                'form'      => $form->createView(),
                'email'     => ($email)? $email : null,
            )
        );
    }

    public function settingsAction(Request $request)
    {
        $user = $this->GetUser();
        /** @var Form $form */
        $form = $this->get('form.factory')->create(AdminSettings::class, $user);
        $em   = $this->getDoctrine()->getManager();
        $form->handleRequest($request);

        $isOldPasswordMatch = (password_verify(
            $form->get('password')->getData(),
            $this->getUser()->getPassword()
        ));
        $isNewPasswordMatch = ($form->get('passwordNew')->getdata(
            ) == $form->get('passwordNewConfirm')->getdata());
        $isChangedUsername  = ($form->get('username')->getdata(
            ) != $this->getUser()->getUsername());
        $isOK               = false;

        if ($form->isSubmitted() && $form->isValid()) {
            if ($isOldPasswordMatch) {
                if ($isChangedUsername) {
                    $user->setUsername($form->get('username')->getdata());
                    $isOK = true;
                }
                if ($form->get('passwordNew')->getdata() && $form->get(
                        'passwordNewConfirm'
                    )->getdata()
                ) {
                    if ($isNewPasswordMatch) {
                        $user->setPassword(
                            password_hash(
                                $form->get('passwordNew')->getdata(),
                                PASSWORD_BCRYPT,
                                ['cost' => 13]
                            )
                        );
                        $isOK = true;
                    } else {
                        $this->addFlash(
                            'info',
                            $this->get('translator')->trans("admin.setting.wrong_pass",[],"controller")
                        );
                    }
                }
                $em->persist($user);
                try {
                    if ($isOK) {
                        $em->flush();
                        $this->addFlash(
                            "success",
                            $this->get('translator')->trans("admin.setting.data_save",[],"controller")
                        );
                    }

                } catch (UniqueConstraintViolationException $e) {
                    $this->addFlash(
                        'danger',
                        $this->get('translator')->trans("admin.setting.user_exist",[],"controller")
                    );

                    return $this->redirectToRoute('settings');
                }
            } else {
                $this->addFlash(
                    'info',
                    $this->get('translator')->trans("admin.setting.current_wrong_pass",[],"controller")
                );
            }
        }

        return $this->render(
            'semappsBundle:Admin:settings.html.twig',
            array(
                'form' => $form->createView(),
                'user' => $user,
            )
        );
    }

    public function changeContextAction($context =null){
        $contextManager = $this->get('semapps_bundle.context_manager');
        $contextManager->setContext($this->getUser()->getSfLink(),urldecode($context));
        $this->addFlash('success', $this->get('translator')->trans("admin.context.success",[],"controller"));
        return $this->redirectToRoute('personComponentFormWithoutId',['uniqueComponentName' =>'person']);
    }

    public function inviteAction(Request $request){
        $form = $this->createFormBuilder(null)
            ->add('email', EmailType::class)
            ->add('submit', SubmitType::class, array('label' => $this->get('translator')->trans("admin.invitation.send",[],"controller")))
            ->getForm();
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()){
            /** @var UserRepository $userRepository */
            $userRepository = $this
                ->getDoctrine()
                ->getManager()
                ->getRepository('semappsBundle:User');

            $inviteManager = $this->get('semapps_bundle.invite_manager');

            $email = $form->get('email')->getData();

            $user = $userRepository->findOneBy(['email' => $email]);
            if ($user){
                $this->addFlash("info", $this->get('translator')->trans("admin.invitation.email_exist",[],"controller"));
                return $this->redirectToRoute('invite');
            }

            $token= $inviteManager->newInvite($email);

            $this->sendEmailInvitation($email,$token);

            $this->addFlash('success', $this->get('translator')->trans("admin.invitation.sended",["email" => $email],"controller"));
        }
        return $this->render(
            'semappsBundle:Admin:invite.html.twig',
            array(
                'form' => $form->createView(),
            )
        );
    }

    public function sendInviteAction($email,$token){
        $this->sendEmailInvitation($email,$token);
        $this->addFlash('success', $this->get('translator')->trans("admin.invitation.sended",["email" => $email],"controller"));
        return $this->redirectToRoute('userList');
    }

    public function deleteInviteAction($email){
        $inviteManager = $this->get('semapps_bundle.invite_manager');
        $inviteManager->removeInvite($email);
        return $this->redirectToRoute('userList');
    }


    private function sendEmailInvitation($email,$token){
        $mailer = $this->get('semapps_bundle.event_listener.send_mail');
        $website = $this->getParameter('carto.domain');
        $url = "http://".$website.'/register/'.$token;
        $sujet = $this->get('translator')->trans("admin.invitation.invited",["website" => $website],"controller");
        $content= $this->get('translator')->trans("admin.invitation.get_invited",["email" => $email, "email2" => $this->getUser()->getEmail(), "website" => $website, "url" => $url],"controller");
        $mailer->sendMessage($email,$sujet,$content);
    }
}
