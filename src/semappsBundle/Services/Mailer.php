<?php

/**
 * Created by PhpStorm.
 * User: tristan
 * Date: 24/02/17
 * Time: 15:33
 */
namespace semappsBundle\Services;
use Symfony\Component\Templating\EngineInterface;
use semappsBundle\Entity\User;
use Symfony\Component\Translation\Translator;
use Symfony\Component\Translation\Writer\TranslationWriter;

/**
 * E-mail Parameters
 */
class Mailer
{
    protected $templating;
    protected $address;
    private $translate;
    private $encryption;
    private $from;
    private $transport;
    private $translator;
    CONST TYPE_USER = 1;
    CONST TYPE_RESPONSIBLE= 2;
    CONST TYPE_NOTIFICATION= 3;
    public function __construct($transport,$from,EngineInterface $templating,Encryption $encryption,$address,/* TranslationWriter $translate*/Translator $translator)
    {
        $this->templating = $templating;
        $this->encryption = $encryption;
        $this->from = $from;
        $this->transport = $transport;
        $this->address = $address;
        //$this->translate = $translate;
        $this->translator = $translator;
    }

    public function sendMessage($to, $subject, $body)
    {
        $mailer = \Swift_Mailer::newInstance($this->transport);
        $mail = \Swift_Message::newInstance()
            ->setFrom($this->from)
            ->setTo($to)
            ->setSubject($subject)
            ->setBody($body)
            ->setContentType('text/html');
        return $mailer->send($mail);
    }

    public function sendConfirmMessage($type, User $user, $url)
    {
        $content = $this->bodyMail( $user, $url,$type);
        return $this->sendMessage($user->getEmail(), $content["subject"], $content["body"]);
    }

    public function sendNotification($type, User $user, Array $to){
        $content = $this->bodyMail( $user,null,$type);
        return $this->sendMessage($to, $content["subject"], $content["body"]);
    }

    // E-mail configuration
    private  function bodyMail(
        User $user,
        $url,
        $type
    ) {
        $content = [];
        switch ($type){
            case self::TYPE_RESPONSIBLE :
                $content['subject'] = $this->translator->trans("subject.welcome",[],"mailer");
                $content['body'] = $this->translator->trans("body.validate",["user" => $user->getUsername(), "address" => $this->address, "url" => $url, "encrypt" => $this->encryption->decrypt($user->getSfUser())],"mailer");
                break;
            case self::TYPE_USER :
                $content['subject'] = $this->translator->trans("subject.welcome",[],"mailer");
                $content['body'] = $this->translator->trans("body.welcome",["user" => $user->getUsername(), "address" => $this->address, "url" => $url, "encrypt" => $this->encryption->decrypt($user->getSfUser())],"mailer");
                break;
            default:
                $content['subject'] = $this->translator->trans("subject.creation",[],"mailer");
                $content['body'] = $this->translator->trans("body.new_user",["email" => $user->getEmail(), "user" => $user->getUsername()],"mailer");
                break;
        }
        return $content;
    }
}