import { useState } from "react";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { storage, db } from "../lib/firebase";
import { collection, getDocs} from "firebase/firestore";


export const useImageLoader = () => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [error, setError] = useState(null);

  const getRandomElement = (array) => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const getRandomElements = (array, n) => {
    // Return N random elements from array 
    const arr = [...array];
    const result = [];
    while (arr.length && result.length < n) {
      const idx = Math.floor(Math.random() * arr.length);
      result.push(arr.splice(idx, 1)[0]);
    }
    return result;
  };




// Get subfolders answered 
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
    // Get the all the subfolders 
    const usedPaths = await getUsedSubfolders();

    // Only for debbug
    // console.log("Número de subpastas já usadas:", usedPaths.size);
    // console.log("Subpastas já usadas:", Array.from(usedPaths));

    // Get all folders
    const rootRef = ref(storage, "/");
    const rootResult = await listAll(rootRef);

    // Filter by the subfolders that are not answered
    const availableMainFolders = [];

    for (const mainFolder of rootResult.prefixes) {
      const subFoldersResult = await listAll(mainFolder);
      const filteredSubs = subFoldersResult.prefixes.filter(
        sf => !usedPaths.has(`${mainFolder.name}/${sf.name}`)
      );
      if (filteredSubs.length > 0) {
        availableMainFolders.push({ mainFolder, subFolders: filteredSubs });
      }
    }
    // Only for debbug
    // console.log("Número de pastas principais disponíveis:", availableMainFolders.length);
    // console.log(
    //   "Número total de subpastas disponíveis:",
    //   availableMainFolders.reduce((acc, folder) => acc + folder.subFolders.length, 0)
    // );

    // Select randomly 4 folders
    const selectedMainFolders = getRandomElements(availableMainFolders, 4);

    let allGroups = [];

    for (const { mainFolder, subFolders } of selectedMainFolders) {
      const datasetName = mainFolder.name;

      // Select one random subfolder from the available ones 
      const selectedSubfolder = getRandomElement(subFolders);

      // Process the images from the selected subfolder
      const subfolderResult = await listAll(selectedSubfolder);

      if (subfolderResult.items.length === 0) continue;

      // Get the context image
      const contextItem = subfolderResult.items.find(
        item => item.name.split(".")[0] === "0"
      );
      const evaluationItems = subfolderResult.items.filter(
        item => item.name.split(".")[0] !== "0"
      );

      let contextImage = null;
      if (contextItem) {
        const contextUrl = await getDownloadURL(contextItem);
        contextImage = {
          name: contextItem.name,
          url: contextUrl,
          folder: selectedSubfolder.name,
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
          folder: selectedSubfolder.name,
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
