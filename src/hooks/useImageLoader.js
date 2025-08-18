import { useState } from "react";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { storage, db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export const useImageLoader = () => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [error, setError] = useState(null);

  const getRandomElement = (array) => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const getRandomElements = (array, n) => {
    // Retorna até N elementos diferentes do array (sem repetir)
    const arr = [...array];
    const result = [];
    while (arr.length && result.length < n) {
      const idx = Math.floor(Math.random() * arr.length);
      result.push(arr.splice(idx, 1)[0]);
    }
    return result;
  };

  // Lê do Firestore as subpastas já usadas
  const getUsedSubfolders = async () => {
    const usedPaths = new Set();

    const querySnapshot = await getDocs(collection(db, "global-survey-evaluations"));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.image && data.image.dataset && data.image.folder) {
        const path = `${data.image.dataset}/${data.image.folder}`;
        usedPaths.add(path);
      }
    });

    return usedPaths;
  };

  const loadImagesWithFolderLogic = async () => {
    setLoadingImages(true);
    setError(null);

    try {
      // Subpastas já usadas
      const usedPaths = await getUsedSubfolders();
      // console.log("Número de subpastas já usadas:", usedPaths.size);
      // console.log("Subpastas já usadas:", Array.from(usedPaths));

      // Todas as pastas principais
      const rootRef = ref(storage, "/");
      const rootResult = await listAll(rootRef);

      const availableMainFolders = [];
      for (const mainFolder of rootResult.prefixes) {
        const subFoldersResult = await listAll(mainFolder);
        const filteredSubs = subFoldersResult.prefixes.filter(
          (sf) => !usedPaths.has(`${mainFolder.name}/${sf.name}`)
        );
        if (filteredSubs.length > 0) {
          availableMainFolders.push({ mainFolder, subFolders: filteredSubs });
        }
      }

      // console.log("Número de pastas principais disponíveis:", availableMainFolders.length);
      // console.log(
      //   "Número total de subpastas disponíveis:",
      //   availableMainFolders.reduce((acc, folder) => acc + folder.subFolders.length, 0)
      // );

      // 🔑 Criar lista única com TODAS as subpastas disponíveis
      const allAvailableSubfolders = [];
      for (const { mainFolder, subFolders } of availableMainFolders) {
        for (const sub of subFolders) {
          allAvailableSubfolders.push({ mainFolder, subFolder: sub });
        }
      }

      // Escolher até 5 subpastas diferentes (sem repetir)
      const selectedSubfolders = getRandomElements(
        allAvailableSubfolders,
        Math.min(5, allAvailableSubfolders.length)
      );

      let allGroups = [];
      for (const { mainFolder, subFolder } of selectedSubfolders) {
        const datasetName = mainFolder.name;

        const subfolderResult = await listAll(subFolder);
        if (subfolderResult.items.length === 0) continue;

        // Contexto (imagem "0") e avaliações
        const contextItem = subfolderResult.items.find(
          (item) => item.name.split(".")[0] === "0"
        );
        const evaluationItems = subfolderResult.items.filter(
          (item) => item.name.split(".")[0] !== "0"
        );

        let contextImage = null;
        if (contextItem) {
          const contextUrl = await getDownloadURL(contextItem);
          contextImage = {
            name: contextItem.name,
            url: contextUrl,
            folder: subFolder.name,
            datasetName,
            isContext: true,
            fileName: "0",
          };
        }

        const evaluationImages = [];
        for (const img of evaluationItems) {
          const url = await getDownloadURL(img);
          const nameWithoutExt = img.name.split(".")[0];
          evaluationImages.push({
            name: img.name,
            url,
            folder: subFolder.name,
            datasetName,
            isContext: false,
            fileName: nameWithoutExt,
          });
        }

        if (contextImage && evaluationImages.length > 0) {
          allGroups.push({ contextImage, evaluationImages });
        }
      }

      setSelectedImages(allGroups);
      return allGroups;
    } catch (error) {
      console.error("Error loading images:", error);
      setError(error.message);
      setSelectedImages([]);
      throw error;
    } finally {
      setLoadingImages(false);
    }
  };

  const resetImages = () => {
    setSelectedImages([]);
    setError(null);
  };

  return {
    selectedImages,
    loadingImages,
    error,
    loadImagesWithFolderLogic,
    resetImages,
  };
};




























  // const loadImagesWithFolderLogic = async () => {
  //   setLoadingImages(true);
  //   setError(null);

  //   try {
  //     // Step 1: Get all top-level folders
  //     const rootRef = ref(storage, "/");
  //     const rootResult = await listAll(rootRef);

  //     if (rootResult.prefixes.length === 0) {
  //       throw new Error("No folders found in survey-images/");
  //     }

  //     // Step 2: Randomly select 4 top-level folders (or less if not enough)
  //     const selectedMainFolders = getRandomElements(rootResult.prefixes, 4);

  //     let allGroups = [];

  //     for (const selectedMainFolder of selectedMainFolders) {
  //       const datasetName = selectedMainFolder.name;
  //       // Step 3: Get all subfolders from the selected main folder
  //       const subFoldersResult = await listAll(selectedMainFolder);

  //       if (subFoldersResult.prefixes.length === 0) {
  //         continue;
  //       }

  //       // Step 4: Randomly select 1 subfolder from each main folder
  //       const selectedSubfolder = getRandomElement(subFoldersResult.prefixes);

  //       // Step 5: Process the selected subfolder
  //       const subfolderResult = await listAll(selectedSubfolder);

  //       if (subfolderResult.items.length === 0) {
  //         continue;
  //       }

  //       // Process context and evaluation images
  //       const contextItem = subfolderResult.items.find(
  //         (item) => item.name.split(".")[0] === "0"
  //       );
  //       const evaluationItems = subfolderResult.items.filter(
  //         (item) => item.name.split(".")[0] !== "0"
  //       );

  //       let contextImage = null;
  //       if (contextItem) {
  //         const contextUrl = await getDownloadURL(contextItem);
  //         contextImage = {
  //           name: contextItem.name,
  //           url: contextUrl,
  //           folder: selectedSubfolder.name,
  //           datasetName,
  //           isContext: true,
  //           fileName: "0",
  //         };
  //       }

  //       const evaluationImages = [];
  //       for (const img of evaluationItems) {
  //         const url = await getDownloadURL(img);
  //         const nameWithoutExt = img.name.split(".")[0];
  //         evaluationImages.push({
  //           name: img.name,
  //           url: url,
  //           folder: selectedSubfolder.name,
  //           datasetName,
  //           isContext: false,
  //           fileName: nameWithoutExt,
  //         });
  //       }

  //       if (contextImage && evaluationImages.length > 0) {
  //         allGroups.push({
  //           contextImage,
  //           evaluationImages,
  //         });
  //       }
  //     }

  //     setSelectedImages(allGroups);
  //     return allGroups;
  //   } catch (error) {
  //     console.error("Error loading images:", error);
  //     setError(error.message);
  //     setSelectedImages([]);
  //     throw error;
  //   } finally {
  //     setLoadingImages(false);
  //   }
  // };
