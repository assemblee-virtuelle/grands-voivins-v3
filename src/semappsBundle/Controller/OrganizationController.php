<?php

namespace semappsBundle\Controller;

use semappsBundle\Form\ImportType;
use Symfony\Component\HttpFoundation\Request;

class OrganizationController extends AbstractMultipleComponentController
{


    public function addAction($componentName ="organization",$id = null,Request $request)
    {
        $uri = urldecode($id);
        $componentConf = $this->getParameter($componentName.'Conf');
        $sparqlRepository   = $this->get('semapps_bundle.sparql_repository');
        if($uri)
            $this->setSfLink($uri);
        $graphURI			= $this->getGraph();
        $sfClient       = $this->get('semantic_forms.client');
        $contextManager       = $this->get('semapps_bundle.context_manager');
        $form 				= $this->getSfForm($sfClient,$componentName, $request);
        if($uri && !$contextManager->actualizeContext($this->getUser()->getSfLink())){
            return $this->redirectToRoute('personComponentFormWithoutId',['uniqueComponentName' => 'person']);
        }

        // Remove old picture.
        $fileUploader = $this->get('semapps_bundle.file_uploader');
        $pictureDir = $fileUploader->getTargetDir();
        //actualPicture
        $sparql = $sparqlRepository->newQuery($sparqlRepository::SPARQL_SELECT);
        $sparql->addPrefixes($sparql->prefixes)
            ->addPrefix('pair', 'http://virtual-assembly.org/pair#')
            ->addSelect('?oldImage')
            ->addWhere(
                $sparql->formatValue($this->getSfLink(), $sparql::VALUE_TYPE_URL),
                'pair:image',
                '?oldImage',
                $sparql->formatValue($graphURI, $sparql::VALUE_TYPE_URL));
        $results = $sfClient->sparql($sparql->getQuery());
        $actualImage = $sfClient->sparqlResultsValues($results);
        $actualImageName = null;
        if (!empty($actualImage)) {
            $cutUrl = explode("/", $actualImage[0]['oldImage']);
            $actualImageName = $cutUrl[sizeof($cutUrl) - 1];
        }
        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            // Manage picture.
            $newPictureName = null;
            if($form->has('organisationPicture')){
                $newPicture = $form->get('organisationPicture')->getData();
                if ($newPicture) {

                    if ($actualImageName) {
                        // Check if file exists to avoid all errors.
                        if (is_file($pictureDir . '/' . $actualImageName)) {
                            $fileUploader->remove($actualImageName);
                        }
                    }
                    $newPictureName = $fileUploader->upload($newPicture);
                    if($uri)
                        $sparqlRepository->changeImage($graphURI,$uri,$fileUploader->generateUrlForFile($newPictureName));
                    $actualImageName = $newPictureName;
                    $this->addFlash(
                        'success',
                        $this->get('translator')->trans("organization.update.picture",[],"controller")
                    );
                }

            }
            if(!json_decode($form->get($componentConf['fields']['http://virtual-assembly.org/pair#hasResponsible']['value'])->getData())){
                $sparql = $sparqlRepository->newQuery($sparqlRepository::SPARQL_INSERT_DATA);
                $sparql->addInsert('<'.$form->uri.'>','<http://virtual-assembly.org/pair#hasResponsible>','<'.$this->getUser()->getSfLink().'>','<'.$form->uri.'>');
                $sfClient->update($sparql->getQuery());
            }
            if(!$newPictureName)
                $this->addFlash(
                    'success',
                    $this->get('translator')->trans("organization.update.success",[],"controller")
                );

            return $this->redirectToRoute('orgaComponentForm',['uniqueComponentName' => $componentName, 'id' =>urlencode($form->uri)]);

        }

        $importForm = null;
        if(!$this->getSfLink()){
            $importForm = $this->createForm(ImportType::class, null);
            $importForm->handleRequest($request);
            $importManager = $this->get('semapps_bundle.import_manager');
            if ($importForm->isSubmitted() && $importForm->isValid()) {
                $uri = $importForm->get('import')->getData();

                $sparql = $sparqlRepository->newQuery($sparqlRepository::SPARQL_SELECT);
                $sparql->addSelect("?o")
                    ->addPrefixes($sparql->prefixes)
                    ->addWhere("<".$uri.">","rdf:type","?o","?gr")
                    ->groupBy("?o");
                $result = $sfClient->sparql($sparql->getQuery());
                $contextManager->setContext($uri,null);
                if(empty($result["results"]["bindings"])){
                    $this->setSfLink($uri);

                    $componentConf = $this->getParameter($componentName.'Conf');
                    $type = array_merge([$componentConf['type']],array_key_exists('otherType',$componentConf)? $componentConf['otherType'] : []);

                    $testForm = $this->getSfForm($sfClient,$componentName, $request,$uri );
                    $dataToSave = $importManager->contentToImport($uri,$componentConf,$type);
                    //dump($dataToSave);exit;
                    if(is_null($dataToSave)){
                        $this->setSfLink(null);
                        $this->addFlash("info", $this->get('translator')->trans("organization.uri.no_data",[],"controller"));

                    }elseif(!$dataToSave){
                        $this->setSfLink(null);
                        $this->addFlash("info", $this->get('translator')->trans("organization.uri.no_corresp",[],"controller"));

                    }else{
                        $this->addFlash("success", $this->get('translator')->trans("organization.uri.success",[],"controller"));
                        if(array_key_exists('hasResponsible',$dataToSave)){
                            $hasResponsible = json_decode($dataToSave['hasResponsible'],JSON_OBJECT_AS_ARRAY);
                            $hasResponsible[$this->getUser()->getSfLink()] = 0;
                            $dataToSave['hasResponsible'] = json_encode($hasResponsible);
                        }
                        else{
                            $hasResponsible[$this->getUser()->getSflink()] = 0;
                            $dataToSave['hasResponsible'] = json_encode($hasResponsible);
                        }
//                    dump($dataToSave);exit;
                        $testForm->submit($dataToSave);
                        return $this->redirectToRoute('orgaComponentForm',['uniqueComponentName' => $componentName, 'id' => urlencode($uri)]);
                    }
                }else{
                    $this->addFlash("info", $this->get('translator')->trans("organization.uri.already_exist",[],"controller"));
                }
            }
        }

        // Fill form
        return $this->render(
            'semappsBundle:'.ucfirst($componentName).':'.$componentName.'Form.html.twig',[
                'importForm'=>  ($importForm)?$importForm->createView():null,
                "form" => $form->createView(),
                "entityUri" => $this->getSfLink(),
                "image" => $actualImageName
            ]
        );
    }

    public function actualizeAction(Request $request,$uniqueComponentName,$id =null){
        $uri = urldecode($id);
        $sfClient =$this->get('semantic_forms.client');
        $importManager = $this->get('semapps_bundle.import_manager');
        if( $uri ){
            $componentConf = $this->getParameter($uniqueComponentName.'Conf');
            $testForm = $this->getSfForm($sfClient,$uniqueComponentName, $request,$uri );
            $type = array_merge([$componentConf['type']],array_key_exists('otherType',$componentConf)? $componentConf['otherType'] : []);
            $dataToSave = $importManager->contentToImport($uri,$componentConf,$type);
            $testForm->submit($dataToSave,false);
            $this->addFlash('success', $this->get('translator')->trans("organization.reload.success",[],"controller"));
        }else{
            $this->addFlash('info', $this->get('translator')->trans("organization.reload.problem",[],"controller"));
        }
        return $this->redirectToRoute('orgaComponentForm',["uniqueComponentName" => $uniqueComponentName,"id" => urlencode($uri)]);
    }
    public function removeAction($uniqueComponentName,Request $request){
        $uri = $request->get('uri');
        $this->removeComponent($uri);
        return $this->redirectToRoute(
            'personComponentFormWithoutId', ["uniqueComponentName" => 'person']
        );
    }

    public function getGraph($id = null)
    {
        return $this->getSfLink();

    }

    public function getSfUser($id = null)
    {
        return $this->getUser()->getEmail();
    }

    public function getSfPassword($id = null)
    {
        $encryption 	= $this->get('semapps_bundle.encryption');
        return $encryption->decrypt($this->getUser()->getSfUser());
    }

    public function componentList($componentConf, $graphURI)
    {
        $sparqlrepository = $this->get('semapps_bundle.sparql_repository');
        $listOfContent = $sparqlrepository->getListOfContentByType($componentConf,$graphURI);
        return $listOfContent;
    }
    public function removeComponent($uri){
        $sfClient = $this->get('semantic_forms.client');
        $sparqlClient   = $this->get('sparqlbundle.client');

        $sparql = $sparqlClient->newQuery($sparqlClient::SPARQL_DELETE);
        $sparqlDeux = clone $sparql;

        $uri = $sparql->formatValue($uri,$sparql::VALUE_TYPE_URL);

        $sparql->addDelete($uri,'?P','?O','?gr')
            ->addWhere($uri,'?P','?O','?gr');
        $sparqlDeux->addDelete('?s','?PP',$uri,'?gr')
            ->addWhere('?s','?PP',$uri,'?gr');

        $sfClient->update($sparql->getQuery());
        $sfClient->update($sparqlDeux->getQuery());
    }
}
